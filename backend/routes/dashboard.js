const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');


router.get('/stats', verifyToken, async (req, res) => {
    try {
        const financeRes = await pool.query(`
            SELECT 
                COALESCE((SELECT SUM(so.quantite_sortie * so.prix_reel) FROM sortie so WHERE date_trunc('day', so.created_at) = CURRENT_DATE), 0) as revenue_today,
                COALESCE((SELECT SUM(so.quantite_sortie * s.prix_achat_unitaire) FROM sortie so JOIN stock s ON so.stock_id = s.id WHERE date_trunc('day', so.created_at) = CURRENT_DATE), 0) as cost_today,
                COALESCE((SELECT SUM(so.quantite_sortie * so.prix_reel) FROM sortie so WHERE date_trunc('month', so.created_at) = date_trunc('month', CURRENT_DATE)), 0) as revenue_month,
                COALESCE((SELECT SUM(so.quantite_sortie * s.prix_achat_unitaire) FROM sortie so JOIN stock s ON so.stock_id = s.id WHERE date_trunc('month', so.created_at) = date_trunc('month', CURRENT_DATE)), 0) as cost_month
        `);

        const countsRes = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM produit WHERE actif = TRUE) as total_produits,
                (SELECT COUNT(*) FROM fournisseur WHERE actif = TRUE) as total_fournisseurs,
                (SELECT COUNT(*) FROM categorie WHERE actif = TRUE) as total_categories
        `);

        const alertsRes = await pool.query(`
            SELECT p.id, p.nom, c.nom as categorie_nom, p.quantite_stock, p.seuil_alerte_stock
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE AND p.quantite_stock <= p.seuil_alerte_stock
            ORDER BY p.quantite_stock ASC
        `);

        const trendRes = await pool.query(`
            SELECT 
                d.date::date as jour,
                COALESCE(SUM(so.quantite_sortie * so.prix_reel), 0) as revenue,
                COALESCE(SUM(so.quantite_sortie * s.prix_achat_unitaire), 0) as cost
            FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d(date)
            LEFT JOIN sortie so ON date_trunc('day', so.created_at) = d.date
            LEFT JOIN stock s ON so.stock_id = s.id
            GROUP BY d.date
            ORDER BY d.date ASC
        `);

        const stats = financeRes.rows[0];
        const counts = countsRes.rows[0];

        res.json({
            today: {
                revenue: parseFloat(stats.revenue_today || 0),
                cost: parseFloat(stats.cost_today || 0),
                margin: parseFloat(stats.revenue_today || 0) - parseFloat(stats.cost_today || 0)
            },
            month: {
                revenue: parseFloat(stats.revenue_month || 0),
                cost: parseFloat(stats.cost_month || 0),
                margin: parseFloat(stats.revenue_month || 0) - parseFloat(stats.cost_month || 0)
            },
            trend: trendRes.rows.map(r => ({
                jour: r.jour,
                revenue: parseFloat(r.revenue),
                cost: parseFloat(r.cost),
                margin: parseFloat(r.revenue) - parseFloat(r.cost)
            })),
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
