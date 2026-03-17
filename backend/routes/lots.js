const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');


router.get('/stock', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.nom, c.nom as categorie_nom, p.origine, p.unite, p.quantite_stock, p.prix_actif, p.seuil_alerte_stock
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE
            ORDER BY p.nom ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.get('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { product_id } = req.query;
        let query = `
            SELECT s.*, p.nom as produit_nom, f.nom as fournisseur_nom,
                   s.quantite_achetee - COALESCE(SUM(so.quantite_sortie), 0) as quantite_restante
            FROM stock s 
            JOIN produit p ON s.produit_id = p.id
            LEFT JOIN fournisseur f ON s.fournisseur_id = f.id
            LEFT JOIN sortie so ON s.id = so.stock_id
        `;
        const params = [];
        if (product_id) {
            query += ' WHERE s.produit_id = $1';
            params.push(product_id);
        }
        query += ' GROUP BY s.id, p.nom, f.nom ORDER BY s.date_entree ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { produit_id, fournisseur_id, quantite_achetee, prix_achat_unitaire } = req.body;
        if (quantite_achetee <= 0 || prix_achat_unitaire < 0) {
            return res.status(400).json('Invalid quantity or price');
        }
        await client.query('BEGIN');
        const newStock = await client.query(
            'INSERT INTO stock (produit_id, fournisseur_id, quantite_achetee, prix_achat_unitaire) VALUES($1, $2, $3, $4) RETURNING *',
            [produit_id, fournisseur_id || null, quantite_achetee, prix_achat_unitaire]
        );
        await client.query('UPDATE produit SET quantite_stock = quantite_stock + $1 WHERE id = $2', [quantite_achetee, produit_id]);
        await client.query('COMMIT');

        res.json(newStock.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
});

module.exports = router;
