const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/taxes - Tous authentifiés
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM taxe WHERE actif = TRUE ORDER BY nom ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/taxes - Manager uniquement
router.post('/', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { nom, taux } = req.body;
        if (!nom || taux === undefined) return res.status(400).json({ error: 'Le nom et le taux sont requis.' });
        const result = await pool.query(
            'INSERT INTO taxe (nom, taux) VALUES ($1, $2) RETURNING *',
            [nom, taux]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/taxes/:id - Manager uniquement
router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('UPDATE taxe SET actif = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        res.json({ message: 'Taxe archivée.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
