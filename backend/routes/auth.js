const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { nom, email, mot_de_passe, role } = req.body;
        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'Tous les champs sont requis.' });
        }
        const existing = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);
        const result = await pool.query(
            'INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role',
            [nom, email, hash, role || 'vendeur']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;
        if (!email || !mot_de_passe) {
            return res.status(400).json({ error: 'Email et mot de passe requis.' });
        }
        const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1 AND actif = TRUE', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!isMatch) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }
        const token = jwt.sign(
            { id: user.id, nom: user.nom, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nom, email, role FROM utilisateur WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
