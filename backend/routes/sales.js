const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');


router.post('/', verifyToken, requireRole('manager', 'vendeur'), async (req, res) => {
    const client = await pool.connect();
    try {
        let { produit_id, quantite_sortie, prix_reel, lieu_vente_id, type } = req.body;
        produit_id = parseInt(produit_id);
        lieu_vente_id = lieu_vente_id ? parseInt(lieu_vente_id) : null;
        type = type || 'vente'; // Default to "vente"

        if (isNaN(produit_id) || quantite_sortie <= 0 || (type === 'vente' && prix_reel < 0)) {
            return res.status(400).json('Invalid quantity or price');
        }

        if (type === 'perte') {
            prix_reel = 0;
            lieu_vente_id = null; // A loss doesn't happen at a specific point of sale usually
        }

        await client.query('BEGIN');

        const stockRes = await client.query(`
            SELECT * FROM (
                SELECT s.id, s.quantite_achetee, s.prix_achat_unitaire, s.created_at,
                    s.quantite_achetee - COALESCE((SELECT SUM(so.quantite_sortie) FROM sortie so WHERE so.entree_id = s.id), 0) as restant
                FROM entree s
                WHERE s.produit_id = $1
            ) sub
            WHERE restant > 0
            ORDER BY created_at ASC, s.id ASC
        `, [produit_id]);

        let stocks = stockRes.rows;
        let qtyNeeded = parseFloat(quantite_sortie);
        let totalAvailable = stocks.reduce((acc, s) => acc + parseFloat(s.restant), 0);

        if (totalAvailable < qtyNeeded) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Stock insuffisant', available: totalAvailable });
        }

        const sortiesCreated = [];

        for (const s of stocks) {
            if (qtyNeeded <= 0) break;
            let qtyToTake = Math.min(parseFloat(s.restant), qtyNeeded);

            const sortieRes = await client.query(
                'INSERT INTO sortie (entree_id, lieu_vente_id, quantite_sortie, prix_reel, created_by, type) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
                [s.id, lieu_vente_id, qtyToTake, prix_reel, req.user.id, type]
            );

            sortiesCreated.push(sortieRes.rows[0]);
            qtyNeeded -= qtyToTake;
        }

        await client.query(
            'UPDATE produit SET quantite_stock = quantite_stock - $1 WHERE id = $2',
            [quantite_sortie, produit_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Vente enregistrée', details: sortiesCreated });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: err.message || 'Erreur serveur.' });
    } finally {
        client.release();
    }
});


router.get('/history', verifyToken, requireRole('manager', 'vendeur'), async (req, res) => {
    try {
        const query = `
            SELECT so.*, s.produit_id, p.nom as produit_nom, s.prix_achat_unitaire, lv.nom as lieu_vente_nom
            FROM sortie so
            JOIN entree s ON so.entree_id = s.id
            JOIN produit p ON s.produit_id = p.id
            LEFT JOIN lieu_vente lv ON so.lieu_vente_id = lv.id
            ORDER BY so.created_at DESC
            LIMIT 100
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
