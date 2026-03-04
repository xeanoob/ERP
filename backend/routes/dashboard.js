const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/dashboard/stats - Tous authentifiés
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const financeQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN date_trunc('day', so.date_sortie) = CURRENT_DATE THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN date_trunc('day', so.date_sortie) = CURRENT_DATE THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost_today,
                COALESCE(SUM(CASE WHEN date_trunc('month', so.date_sortie) = date_trunc('month', CURRENT_DATE) THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue_month,
                COALESCE(SUM(CASE WHEN date_trunc('month', so.date_sortie) = date_trunc('month', CURRENT_DATE) THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost_month
            FROM sortie so
            JOIN stock s ON so.stock_id = s.id
        `;

        const countsQuery = `
            SELECT
                (SELECT COUNT(*) FROM produit WHERE actif = TRUE) as total_produits,
                (SELECT COUNT(*) FROM fournisseur WHERE actif = TRUE) as total_fournisseurs,
                (SELECT COUNT(*) FROM categorie WHERE actif = TRUE) as total_categories
        `;

        const alertsQuery = `
            SELECT p.id, p.nom, c.nom as categorie_nom, p.quantite_stock, p.seuil_alerte_stock
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE AND p.quantite_stock <= p.seuil_alerte_stock
            ORDER BY p.quantite_stock ASC
        `;

        const [financeRes, countsRes, alertsRes] = await Promise.all([
            pool.query(financeQuery),
            pool.query(countsQuery),
            pool.query(alertsQuery),
        ]);

        const stats = financeRes.rows[0];
        const counts = countsRes.rows[0];

        res.json({
            today: {
                revenue: parseFloat(stats.revenue_today),
                cost: parseFloat(stats.cost_today),
                margin: parseFloat(stats.revenue_today) - parseFloat(stats.cost_today)
            },
            month: {
                revenue: parseFloat(stats.revenue_month),
                cost: parseFloat(stats.cost_month),
                margin: parseFloat(stats.revenue_month) - parseFloat(stats.cost_month)
            },
            counts: {
                produits: parseInt(counts.total_produits),
                fournisseurs: parseInt(counts.total_fournisseurs),
                categories: parseInt(counts.total_categories),
            },
            alertes_stock: alertsRes.rows.map(r => ({
                id: r.id,
                nom: r.nom,
                categorie: r.categorie_nom,
                stock_actuel: parseFloat(r.quantite_stock),
                seuil: parseFloat(r.seuil_alerte_stock),
            })),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
