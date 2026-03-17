const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');


router.get('/stats', verifyToken, async (req, res) => {
    try {
        const range = req.query.range || '7days';

        let startDateStr = "CURRENT_DATE - INTERVAL '6 days'";
        let endDateStr = "CURRENT_DATE";

        if (range === '30days') {
            startDateStr = "CURRENT_DATE - INTERVAL '29 days'";
        } else if (range === 'lastMonth') {
            startDateStr = "date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date";
            endDateStr = "(date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date";
        } else if (range === '3months') {
            startDateStr = "CURRENT_DATE - INTERVAL '89 days'";
        } else if (range === 'thisYear') {
            startDateStr = "date_trunc('year', CURRENT_DATE)::date";
        } else if (range === 'lastYear') {
            startDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '1 year')::date";
            endDateStr = "(date_trunc('year', CURRENT_DATE) - INTERVAL '1 day')::date";
        }

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

        // Determine previous period for comparison
        let prevStartDateStr, prevEndDateStr;
        if (range === '7days') {
            prevStartDateStr = "CURRENT_DATE - INTERVAL '13 days'";
            prevEndDateStr = "CURRENT_DATE - INTERVAL '7 days'";
        } else if (range === '30days') {
            prevStartDateStr = "CURRENT_DATE - INTERVAL '59 days'";
            prevEndDateStr = "CURRENT_DATE - INTERVAL '30 days'";
        } else if (range === 'lastMonth') {
            prevStartDateStr = "date_trunc('month', CURRENT_DATE - INTERVAL '2 month')::date";
            prevEndDateStr = "(date_trunc('month', CURRENT_DATE - INTERVAL '1 month') - INTERVAL '1 day')::date";
        } else if (range === '3months') {
            prevStartDateStr = "CURRENT_DATE - INTERVAL '179 days'";
            prevEndDateStr = "CURRENT_DATE - INTERVAL '90 days'";
        } else if (range === 'thisYear') {
            prevStartDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '1 year')::date";
            prevEndDateStr = "date_trunc('year', CURRENT_DATE) - INTERVAL '1 day'";
        } else if (range === 'lastYear') {
            prevStartDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '2 year')::date";
            prevEndDateStr = "(date_trunc('year', CURRENT_DATE - INTERVAL '1 year') - INTERVAL '1 day')::date";
        }

        const prevStatsRes = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost,
                COALESCE(SUM(CASE WHEN so.type = 'perte' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as perte_cost
            FROM sortie so
            JOIN stock s ON so.stock_id = s.id
            WHERE so.created_at BETWEEN ${prevStartDateStr} AND ${prevEndDateStr}
        `);

        // We use generate_series with '1 day' to have consistent data points for any range
        const trendRes = await pool.query(`
            SELECT 
                d.date::date as jour,
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost,
                COALESCE(SUM(CASE WHEN so.type = 'perte' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as perte_cost
            FROM generate_series(${startDateStr}, ${endDateStr}, '1 day'::interval) d(date)
            LEFT JOIN sortie so ON date_trunc('day', so.created_at) = d.date
            LEFT JOIN stock s ON so.stock_id = s.id
            GROUP BY d.date
            ORDER BY d.date ASC
        `);

        const chargesRes = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN periode = 'jour' THEN montant ELSE 0 END), 0) as charges_jour,
                COALESCE(SUM(CASE WHEN periode = 'mensuel' THEN montant ELSE 0 END), 0) as charges_mois
            FROM charge_fixe WHERE actif = TRUE
        `);

        const counts = countsRes.rows[0];
        const charges = chargesRes.rows[0];
        const prevStats = prevStatsRes.rows[0];

        const fixed_cost_day = parseFloat(charges.charges_jour) + (parseFloat(charges.charges_mois) / 30);

        let total_revenue = 0;
        let total_cost = 0;
        let total_pertes_cost = 0;

        const trend = trendRes.rows.map(r => {
            const rev = parseFloat(r.revenue);
            const cost = parseFloat(r.cost) + fixed_cost_day;
            const perte_cost = parseFloat(r.perte_cost);
            
            total_revenue += rev;
            total_cost += cost;
            total_pertes_cost += perte_cost;
            
            return {
                jour: r.jour,
                revenue: rev,
                cost: cost,
                perte_cost: perte_cost,
                margin: rev - cost
            };
        });

        // Add fixed costs to previous period for fair comparison
        // We'll approximate the number of days in the period
        const periodDaysRes = await pool.query(`SELECT COUNT(*) FROM generate_series(${startDateStr}, ${endDateStr}, '1 day'::interval)`);
        const numDays = parseInt(periodDaysRes.rows[0].count);
        const prev_total_cost = parseFloat(prevStats.cost) + (fixed_cost_day * numDays);

        res.json({
            period: {
                revenue: total_revenue,
                cost: total_cost,
                perte_cost: total_pertes_cost,
                margin: total_revenue - total_cost
            },
            previous_period: {
                revenue: parseFloat(prevStats.revenue),
                cost: prev_total_cost,
                perte_cost: parseFloat(prevStats.perte_cost),
                margin: parseFloat(prevStats.revenue) - prev_total_cost
            },
            trend: trend,
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
