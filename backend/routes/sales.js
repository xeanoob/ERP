const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/sales - Record a sale with FIFO logic
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { produit_id, quantite_sortie, prix_vente_unitaire } = req.body;

        if (quantite_sortie <= 0 || prix_vente_unitaire < 0) {
            return res.status(400).json('Invalid quantity or price');
        }

        await client.query('BEGIN');

        // 1. Get available lots (FIFO: Oldest first)
        const lotsRes = await client.query(
            'SELECT * FROM lots WHERE produit_id = $1 AND quantite_restante > 0 ORDER BY date_entree ASC FOR UPDATE',
            [produit_id]
        );

        let lots = lotsRes.rows;
        let qtyNeeded = parseFloat(quantite_sortie);
        let totalAvailable = lots.reduce((acc, lot) => acc + parseFloat(lot.quantite_restante), 0);

        if (totalAvailable < qtyNeeded) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient stock', available: totalAvailable });
        }

        const sortiesCreated = [];

        // 2. Iterate and deduct
        for (const lot of lots) {
            if (qtyNeeded <= 0) break;

            let qtyToTake = 0;
            let currentLotQty = parseFloat(lot.quantite_restante);

            if (currentLotQty >= qtyNeeded) {
                qtyToTake = qtyNeeded;
            } else {
                qtyToTake = currentLotQty;
            }

            // Update Lot
            await client.query(
                'UPDATE lots SET quantite_restante = quantite_restante - $1 WHERE id = $2',
                [qtyToTake, lot.id]
            );

            // Create Sortie Record
            const sortieRes = await client.query(
                'INSERT INTO sorties (lot_id, quantite_sortie, prix_vente_unitaire) VALUES($1, $2, $3) RETURNING *',
                [lot.id, qtyToTake, prix_vente_unitaire]
            );

            sortiesCreated.push(sortieRes.rows[0]);
            qtyNeeded -= qtyToTake;
        }

        await client.query('COMMIT');
        res.json({ message: 'Sale recorded successfully', details: sortiesCreated });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
});

// GET /api/sales/history - Get recent sales
router.get('/history', async (req, res) => {
    try {
        const query = `
            SELECT s.*, l.produit_id, p.nom as produit_nom, l.prix_achat_unitaire
            FROM sorties s
            JOIN lots l ON s.lot_id = l.id
            JOIN produits p ON l.produit_id = p.id
            ORDER BY s.date_sortie DESC
            LIMIT 50
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
