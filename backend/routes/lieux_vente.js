const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/lieux_vente
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lieu_vente WHERE actif = TRUE ORDER BY nom ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/lieux_vente - Manager ou Stock
router.post('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    const { nom } = req.body;
    if (!nom) {
        return res.status(400).json({ error: 'Le nom du lieu de vente est requis.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO lieu_vente (nom) VALUES ($1) RETURNING *',
            [nom.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/lieux_vente/:id - Manager uniquement
router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        // Au lieu d'une vraie suppression, on archive (soft delete)
        const result = await pool.query(
            'UPDATE lieu_vente SET actif = FALSE WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lieu de vente non trouvé.' });
        }

        res.json({ message: 'Lieu de vente archivé avec succès.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
