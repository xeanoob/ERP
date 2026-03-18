const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const range = req.query.range || '7days';

        let startDateStr = "CURRENT_DATE - INTERVAL '6 days'";
        let endDateStr = "CURRENT_DATE";
        let prevStartDateStr = "CURRENT_DATE - INTERVAL '13 days'";
        let prevEndDateStr = "CURRENT_DATE - INTERVAL '7 days'";

        if (range === '30days') {
            startDateStr = "CURRENT_DATE - INTERVAL '29 days'";
            prevStartDateStr = "CURRENT_DATE - INTERVAL '59 days'";
            prevEndDateStr = "CURRENT_DATE - INTERVAL '30 days'";
        } else if (range === 'lastMonth') {
            startDateStr = "date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date";
            endDateStr = "(date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date";
            prevStartDateStr = "date_trunc('month', CURRENT_DATE - INTERVAL '2 month')::date";
            prevEndDateStr = "(date_trunc('month', CURRENT_DATE - INTERVAL '1 month') - INTERVAL '1 day')::date";
        } else if (range === '3months') {
            startDateStr = "CURRENT_DATE - INTERVAL '89 days'";
            prevStartDateStr = "CURRENT_DATE - INTERVAL '179 days'";
            prevEndDateStr = "CURRENT_DATE - INTERVAL '90 days'";
        } else if (range === 'thisYear') {
            startDateStr = "date_trunc('year', CURRENT_DATE)::date";
            prevStartDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '1 year')::date";
            prevEndDateStr = "(date_trunc('year', CURRENT_DATE) - INTERVAL '1 day')::date";
        } else if (range === 'lastYear') {
            startDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '1 year')::date";
            endDateStr = "(date_trunc('year', CURRENT_DATE) - INTERVAL '1 day')::date";
            prevStartDateStr = "date_trunc('year', CURRENT_DATE - INTERVAL '2 year')::date";
            prevEndDateStr = "(date_trunc('year', CURRENT_DATE - INTERVAL '1 year') - INTERVAL '1 day')::date";
        }

        const statsQuery = `
            WITH period_totals AS (
                SELECT 
                    COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue,
                    COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost,
                    COALESCE(SUM(CASE WHEN so.type = 'perte' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as perte_cost
                FROM sortie so
                JOIN entree s ON so.entree_id = s.id
                WHERE so.created_at BETWEEN ${startDateStr} AND ${endDateStr}
            ),
            prev_totals AS (
                SELECT 
                    COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue,
                    COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost,
                    COALESCE(SUM(CASE WHEN so.type = 'perte' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as perte_cost
                FROM sortie so
                JOIN entree s ON so.entree_id = s.id
                WHERE so.created_at BETWEEN ${prevStartDateStr} AND ${prevEndDateStr}
            ),
            counts AS (
                SELECT
                    (SELECT COUNT(*) FROM produit WHERE actif = TRUE) as total_produits,
                    (SELECT COUNT(*) FROM fournisseur WHERE actif = TRUE) as total_fournisseurs,
                    (SELECT COUNT(*) FROM categorie WHERE actif = TRUE) as total_categories
            )
            SELECT 
                period_totals.revenue as revenue,
                period_totals.cost as cost,
                period_totals.perte_cost as perte_cost,
                prev.revenue as prev_revenue,
                prev.cost as prev_cost,
                prev.perte_cost as prev_perte_cost,
                counts.total_produits,
                counts.total_fournisseurs,
                counts.total_categories
            FROM period_totals, prev_totals as prev, counts;
        `;

        const statsRes = await pool.query(statsQuery);
        const allStats = statsRes.rows[0];

        const trendRes = await pool.query(`
            SELECT 
                d.date::date as jour,
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * so.prix_reel ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN so.type = 'vente' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as cost,
                COALESCE(SUM(CASE WHEN so.type = 'perte' THEN so.quantite_sortie * s.prix_achat_unitaire ELSE 0 END), 0) as perte_cost
            FROM generate_series((${startDateStr})::timestamp, (${endDateStr})::timestamp, '1 day'::interval) d(date)
            LEFT JOIN sortie so ON date_trunc('day', so.created_at) = d.date
            LEFT JOIN entree s ON so.entree_id = s.id
            GROUP BY d.date
            ORDER BY d.date ASC
        `);

        const chargesRes = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN periode = 'jour' THEN montant ELSE 0 END), 0) as charges_jour,
                COALESCE(SUM(CASE WHEN periode = 'mensuel' THEN montant ELSE 0 END), 0) as charges_mois
            FROM charge_fixe WHERE actif = TRUE
        `);

        const charges = chargesRes.rows[0];
        const fixed_cost_day = parseFloat(charges.charges_jour) + (parseFloat(charges.charges_mois) / 30);

        const trend = trendRes.rows.map(r => {
            const rev = parseFloat(r.revenue);
            const cost = parseFloat(r.cost) + fixed_cost_day;
            const perte_cost = parseFloat(r.perte_cost);
            return {
                jour: r.jour,
                revenue: rev,
                cost: cost,
                perte_cost: perte_cost,
                margin: rev - cost
            };
        });

        const periodDaysRes = await pool.query(`SELECT COUNT(*) FROM generate_series((${startDateStr})::timestamp, (${endDateStr})::timestamp, '1 day'::interval)`);
        const numDays = parseInt(periodDaysRes.rows[0].count);
        const prev_total_cost = parseFloat(allStats.prev_cost || 0) + (fixed_cost_day * numDays);

        const alertsRes = await pool.query(`
            SELECT p.id, p.nom, c.nom as categorie_nom, p.quantite_stock, p.seuil_alerte_stock
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE 
            AND p.quantite_stock <= p.seuil_alerte_stock
            ORDER BY p.quantite_stock ASC
        `);

        res.json({
            period: {
                revenue: parseFloat(allStats.revenue),
                cost: parseFloat(allStats.cost) + (fixed_cost_day * numDays),
                perte_cost: parseFloat(allStats.perte_cost),
                margin: parseFloat(allStats.revenue) - (parseFloat(allStats.cost) + (fixed_cost_day * numDays))
            },
            previous_period: {
                revenue: parseFloat(allStats.prev_revenue || 0),
                cost: prev_total_cost,
                perte_cost: parseFloat(allStats.prev_perte_cost || 0),
                margin: parseFloat(allStats.prev_revenue || 0) - prev_total_cost
            },
            trend: trend,
            counts: {
                produits: parseInt(allStats.total_produits),
                fournisseurs: parseInt(allStats.total_fournisseurs),
                categories: parseInt(allStats.total_categories),
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
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

module.exports = router;
