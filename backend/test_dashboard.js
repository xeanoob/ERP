require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT)
});

async function testQuery() {
    try {
        await client.connect();

        console.log("---- TICK 1 ----");
        const financeRes = await client.query(`
            SELECT 
                COALESCE((SELECT SUM(so.quantite_sortie * so.prix_reel) FROM sortie so WHERE date_trunc('day', so.created_at) = CURRENT_DATE), 0) as revenue_today,
                COALESCE((SELECT SUM(so.quantite_sortie * s.prix_achat_unitaire) FROM sortie so JOIN stock s ON so.stock_id = s.id WHERE date_trunc('day', so.created_at) = CURRENT_DATE), 0) as cost_today,
                COALESCE((SELECT SUM(so.quantite_sortie * so.prix_reel) FROM sortie so WHERE date_trunc('month', so.created_at) = date_trunc('month', CURRENT_DATE)), 0) as revenue_month,
                COALESCE((SELECT SUM(so.quantite_sortie * s.prix_achat_unitaire) FROM sortie so JOIN stock s ON so.stock_id = s.id WHERE date_trunc('month', so.created_at) = date_trunc('month', CURRENT_DATE)), 0) as cost_month
        `);
        console.log("FINANCE OK:", financeRes.rows[0]);

        console.log("---- TICK 2 ----");
        const countsRes = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM produit WHERE actif = TRUE) as total_produits,
                (SELECT COUNT(*) FROM fournisseur WHERE actif = TRUE) as total_fournisseurs,
                (SELECT COUNT(*) FROM categorie WHERE actif = TRUE) as total_categories
        `);
        console.log("COUNTS OK:", countsRes.rows[0]);

        console.log("---- TICK 3 ----");
        const alertsRes = await client.query(`
            SELECT p.id, p.nom, c.nom as categorie_nom, p.quantite_stock, p.seuil_alerte_stock
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE AND p.quantite_stock <= p.seuil_alerte_stock
            ORDER BY p.quantite_stock ASC
        `);
        console.log("ALERTS OK:", alertsRes.rows.length);

        console.log("---- TICK 4 ----");
        const trendRes = await client.query(`
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
        console.log("TREND OK:", trendRes.rows.length);

    } catch (err) {
        console.error("DB ERROR: ", err.message);
    } finally {
        await client.end();
    }
}

testQuery();
