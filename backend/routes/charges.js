const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/charges - Obtenir toutes les charges actives
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM charge_fixe WHERE actif = TRUE ORDER BY nom ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/charges - Ajouter une nouvelle charge (Manager)
router.post('/', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { nom, montant, periode } = req.body;
        if (!nom || !montant) return res.status(400).json({ error: 'Nom et montant requis.' });
        if (periode && !['mensuel', 'jour'].includes(periode)) return res.status(400).json({ error: 'Période invalide.' });

        const result = await pool.query(
            'INSERT INTO charge_fixe (nom, montant, periode) VALUES ($1, $2, $3) RETURNING *',
            [nom, montant, periode || 'mensuel']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/charges/:id - Archiver une charge (Manager)
router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('UPDATE charge_fixe SET actif = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Non trouvé.' });
        res.json({ message: 'Charge archivée.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
