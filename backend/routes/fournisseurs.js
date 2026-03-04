const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/fournisseurs - Manager ou Stock
router.get('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM fournisseur WHERE actif = TRUE';
        const params = [];
        if (search) {
            query += ' AND (nom ILIKE $1 OR contact ILIKE $1 OR email ILIKE $1)';
            params.push(`%${search}%`);
        }
        query += ' ORDER BY nom ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// POST /api/fournisseurs - Manager ou Stock
router.post('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { nom, contact, email, telephone, adresse } = req.body;
        if (!nom) return res.status(400).json({ error: 'Le nom est requis.' });
        const result = await pool.query(
            'INSERT INTO fournisseur (nom, contact, email, telephone, adresse) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [nom, contact, email, telephone, adresse]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// PUT /api/fournisseurs/:id - Manager ou Stock
router.put('/:id', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { nom, contact, email, telephone, adresse } = req.body;
        const result = await pool.query(
            'UPDATE fournisseur SET nom=$1, contact=$2, email=$3, telephone=$4, adresse=$5 WHERE id=$6 RETURNING *',
            [nom, contact, email, telephone, adresse, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        res.json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// DELETE /api/fournisseurs/:id - Manager uniquement
router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('UPDATE fournisseur SET actif = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        res.json({ message: 'Fournisseur archivé.' });
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;
