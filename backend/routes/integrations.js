const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

// --- INTERNAL API (Protected by JWT) ---

// Get all API keys
router.get('/api-keys', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Generate new API key for a service
router.post('/api-keys', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { service_name } = req.body;
        if (!service_name) return res.status(400).json({ error: 'Service name required' });

        // Generate a random secure key
        const newKey = crypto.randomBytes(32).toString('hex');

        // Upsert the API key for the service
        const result = await pool.query(`
            INSERT INTO api_keys (service_name, api_key, updated_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (service_name) DO UPDATE 
            SET api_key = EXCLUDED.api_key, updated_at = CURRENT_TIMESTAMP, actif = TRUE
            RETURNING *
        `, [service_name, newKey]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Toggle API Key status
router.put('/api-keys/:id/toggle', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE api_keys SET actif = NOT actif, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- EXTERNAL WEBHOOKS (Protected by API Key) ---

// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
    const apiKey = req.query.api_key || req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

    try {
        const result = await pool.query('SELECT * FROM api_keys WHERE api_key = $1 AND actif = TRUE', [apiKey]);
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid or inactive API Key' });
        }
        req.apiService = result.rows[0];
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error during authentication' });
    }
};

// Webhook for EOS Scale / Caisse
// Expected payload: { "sales": [{ "nom": "Pomme", "poids_vendu": 12.5, "prix_total": 45.0, "lieu_vente_id": 1 }] }
// or [{ ... }] array directly
router.post('/eos', verifyApiKey, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let salesData = req.body;
        if (req.body && req.body.sales) {
            salesData = req.body.sales;
        }

        if (!Array.isArray(salesData)) {
            return res.status(400).json({ error: 'Invalid payload format. Expected an array of sales or an object with "sales".' });
        }

        const stats = { processed: 0, skipped: 0, errors: [] };

        for (const item of salesData) {
            if (!item.nom || !item.poids_vendu) {
                stats.skipped++;
                stats.errors.push(`Missing 'nom' or 'poids_vendu' for an item.`);
                continue;
            }

            // Find product by exact name match (case insensitive could be better)
            const prodRes = await client.query('SELECT id, quantite_stock, prix_actif FROM produit WHERE nom ILIKE $1 AND actif = TRUE', [item.nom]);
            
            if (prodRes.rows.length === 0) {
                stats.skipped++;
                stats.errors.push(`Product '${item.nom}' not found.`);
                continue;
            }

            const product = prodRes.rows[0];
            const qteVendue = parseFloat(item.poids_vendu);
            
            // If the scale sends prix_total, use it to calculate prix_reel unit price, otherwise use product active price
            let prixUnitaireReel = parseFloat(product.prix_actif);
            if (item.prix_total) {
                prixUnitaireReel = parseFloat(item.prix_total) / qteVendue;
            }

            // Get latest stock entry
            const stockRes = await client.query(`
                SELECT id, quantite_restante 
                FROM stock 
                WHERE produit_id = $1 AND quantite_restante > 0 
                ORDER BY created_at ASC LIMIT 1
            `, [product.id]);

            let stockId = stockRes.rows.length > 0 ? stockRes.rows[0].id : null;

            // Register the sale (sortie)
            await client.query(`
                INSERT INTO sortie (produit_id, stock_id, quantite_sortie, prix_reel, lieu_vente_id, type)
                VALUES ($1, $2, $3, $4, $5, 'vente')
            `, [product.id, stockId, qteVendue, prixUnitaireReel, item.lieu_vente_id || null]);

            // Update main product stock
            await client.query('UPDATE produit SET quantite_stock = quantite_stock - $1 WHERE id = $2', [qteVendue, product.id]);

            // Deduct from lot if tracking
            if (stockId) {
                await client.query('UPDATE stock SET quantite_restante = GREATEST(0, quantite_restante - $1) WHERE id = $2', [qteVendue, stockId]);
            }

            stats.processed++;
        }

        await client.query('COMMIT');
        res.json({ message: 'Sync successful', stats });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Server Error during sync' });
    } finally {
        client.release();
    }
});

module.exports = router;
