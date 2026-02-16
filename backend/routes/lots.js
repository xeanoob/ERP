const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/lots - List lots (optional filter by product)
router.get('/', async (req, res) => {
    try {
        const { product_id } = req.query;
        let query = 'SELECT lots.*, produits.nom as produit_nom FROM lots JOIN produits ON lots.produit_id = produits.id';
        const params = [];

        if (product_id) {
            query += ' WHERE produit_id = $1';
            params.push(product_id);
        }

        query += ' ORDER BY date_entree DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/lots - Add a new stock entry
router.post('/', async (req, res) => {
    try {
        const { produit_id, quantite, prix_achat_unitaire } = req.body;

        // Validation
        if (quantite <= 0 || prix_achat_unitaire < 0) {
            return res.status(400).json('Invalid quantity or price');
        }

        const newLot = await pool.query(
            'INSERT INTO lots (produit_id, quantite_initiale, quantite_restante, prix_achat_unitaire) VALUES($1, $2, $3, $4) RETURNING *',
            [produit_id, quantite, quantite, prix_achat_unitaire]
        );

        res.json(newLot.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/lots/stock - Get aggregated stock per product
router.get('/stock', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.nom, 
                p.categorie, 
                COALESCE(SUM(l.quantite_restante), 0) as stock_total,
                -- weighted average cost (indicative)
                CASE WHEN SUM(l.quantite_restante) > 0 THEN
                    SUM(l.quantite_restante * l.prix_achat_unitaire) / SUM(l.quantite_restante)
                ELSE 0 END as prix_moyen_pondere
            FROM produits p
            LEFT JOIN lots l ON p.id = l.produit_id
            WHERE p.actif = TRUE
            GROUP BY p.id
            ORDER BY p.nom ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
