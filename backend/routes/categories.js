const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/categories - Tous authentifiés
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categorie WHERE actif = TRUE ORDER BY nom ASC');
        res.json(result.rows);
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// POST /api/categories - Manager ou Stock
router.post('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { nom } = req.body;
        if (!nom) return res.status(400).json({ error: 'Le nom est requis.' });
        const result = await pool.query('INSERT INTO categorie (nom) VALUES ($1) RETURNING *', [nom]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Cette catégorie existe déjà.' });
        console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/categories/:id - Manager uniquement
router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('UPDATE categorie SET actif = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        res.json({ message: 'Catégorie archivée.' });
    } catch (err) { console.error(err.message); res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;
