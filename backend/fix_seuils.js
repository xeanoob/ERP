const pool = require('./db');
async function fixSeuils() {
    try {
        const res = await pool.query('UPDATE produit SET seuil_alerte_stock = 10 WHERE seuil_alerte_stock IS NULL RETURNING *');
        console.log(`Updated ${res.rowCount} products to have a default alert threshold of 10.`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
fixSeuils();
