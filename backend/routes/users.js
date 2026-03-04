const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/users — Liste tous les utilisateurs (manager only)
router.get('/', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nom, email, role, actif, created_at FROM utilisateur ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/users — Créer un utilisateur (manager only)
router.post('/', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { nom, email, mot_de_passe, role } = req.body;
        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
        }

        const existing = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);

        const result = await pool.query(
            'INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, actif, created_at',
            [nom, email, hash, role || 'vendeur']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/users/:id/role — Changer le rôle (manager only)
router.put('/:id/role', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['vendeur', 'stock', 'manager'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide.' });
        }

        const result = await pool.query(
            'UPDATE utilisateur SET role = $1 WHERE id = $2 RETURNING id, nom, email, role, actif',
            [role, req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/users/:id/toggle — Activer/désactiver (manager only)
router.put('/:id/toggle', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE utilisateur SET actif = NOT actif WHERE id = $1 RETURNING id, nom, email, role, actif',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
