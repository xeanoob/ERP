const pool = require('./db');
async function check() {
    const alertsRes = await pool.query(`
        SELECT p.id, p.nom, c.nom as categorie_nom, p.quantite_stock, p.seuil_alerte_stock
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id
        WHERE p.actif = TRUE AND p.quantite_stock <= p.seuil_alerte_stock
        ORDER BY p.quantite_stock ASC
    `);
    console.log("Dashboard Alerts Query:", alertsRes.rows);
    process.exit(0);
}
check();
