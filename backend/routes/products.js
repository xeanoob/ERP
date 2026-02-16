const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products - List all products (optionally filter by active status)
router.get('/', async (req, res) => {
    try {
        const { includeArchived } = req.query;
        let query = 'SELECT * FROM produits';
        if (includeArchived !== 'true') {
            query += ' WHERE actif = true';
        }
        query += ' ORDER BY nom ASC';

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/products - Create a new product
router.post('/', async (req, res) => {
    try {
        const { nom, categorie, variete } = req.body;
        const newProduct = await pool.query(
            'INSERT INTO produits (nom, categorie, variete) VALUES($1, $2, $3) RETURNING *',
            [nom, categorie, variete]
        );
        res.json(newProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/products/:id - Update a product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, categorie, variete } = req.body;
        const updateProduct = await pool.query(
            'UPDATE produits SET nom = $1, categorie = $2, variete = $3 WHERE id = $4 RETURNING *',
            [nom, categorie, variete, id]
        );
        if (updateProduct.rows.length === 0) {
            return res.status(404).json('Product not found');
        }
        res.json(updateProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/products/:id - Soft delete (archive)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete: set actif = FALSE
        const deleteProduct = await pool.query(
            'UPDATE produits SET actif = FALSE WHERE id = $1 RETURNING *',
            [id]
        );
        if (deleteProduct.rows.length === 0) {
            return res.status(404).json('Product not found');
        }
        res.json({ message: 'Product archived (soft deleted)', product: deleteProduct.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
