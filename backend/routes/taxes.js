const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');


router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM taxe WHERE actif = TRUE ORDER BY nom ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});


router.post('/', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { nom, taux } = req.body;
        if (!nom || taux === undefined) return res.status(400).json({ error: 'Le nom et le taux sont requis.' });
        
        // Check if there are any active taxes
        const existingCount = await pool.query('SELECT COUNT(*) FROM taxe WHERE actif = TRUE');
        const isFirst = parseInt(existingCount.rows[0].count) === 0;

        const result = await pool.query(
            'INSERT INTO taxe (nom, taux, is_default) VALUES ($1, $2, $3) RETURNING *',
            [nom, taux, isFirst]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});


router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('UPDATE taxe SET actif = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        
        // If the deleted tax was default, try to set the first available active tax as default
        if (result.rows[0].is_default) {
            await pool.query('UPDATE taxe SET is_default = TRUE WHERE id = (SELECT id FROM taxe WHERE actif = TRUE LIMIT 1)');
        }
        res.json({ message: 'Taxe archivée.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/taxes/:id/default - Manager uniquement
router.put('/:id/default', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        await pool.query('UPDATE taxe SET is_default = FALSE');
        const result = await pool.query('UPDATE taxe SET is_default = TRUE WHERE id = $1 RETURNING *', [req.params.id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Taxe non trouvée.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
