const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // Calculate stats for Today and This Month
        // Revenue = SUM(quantite_sortie * prix_vente_unitaire)
        // Cost = SUM(quantite_sortie * lots.prix_achat_unitaire)
        // Margin = Revenue - Cost

        const query = `
            SELECT 
                -- TODAY
                COALESCE(SUM(CASE WHEN date_trunc('day', s.date_sortie) = CURRENT_DATE THEN s.quantite_sortie * s.prix_vente_unitaire ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN date_trunc('day', s.date_sortie) = CURRENT_DATE THEN s.quantite_sortie * l.prix_achat_unitaire ELSE 0 END), 0) as cost_today,
                
                -- MONTH
                COALESCE(SUM(CASE WHEN date_trunc('month', s.date_sortie) = date_trunc('month', CURRENT_DATE) THEN s.quantite_sortie * s.prix_vente_unitaire ELSE 0 END), 0) as revenue_month,
                COALESCE(SUM(CASE WHEN date_trunc('month', s.date_sortie) = date_trunc('month', CURRENT_DATE) THEN s.quantite_sortie * l.prix_achat_unitaire ELSE 0 END), 0) as cost_month
                
            FROM sorties s
            JOIN lots l ON s.lot_id = l.id
        `;

        const result = await pool.query(query);
        const stats = result.rows[0];

        const response = {
            today: {
                revenue: parseFloat(stats.revenue_today),
                cost: parseFloat(stats.cost_today),
                margin: parseFloat(stats.revenue_today) - parseFloat(stats.cost_today)
            },
            month: {
                revenue: parseFloat(stats.revenue_month),
                cost: parseFloat(stats.cost_month),
                margin: parseFloat(stats.revenue_month) - parseFloat(stats.cost_month)
            }
        };

        res.json(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
