const pool = require('./db');
async function check() {
    const r1 = await pool.query('SELECT p.id, p.nom, p.quantite_stock, p.seuil_alerte_stock FROM produit p LIMIT 10');
    console.log("Produits table:", r1.rows);
    
    const r2 = await pool.query(`
        SELECT p.id, p.nom, 
        COALESCE((SELECT SUM(s.quantite_achetee) FROM stock s WHERE s.produit_id = p.id), 0) -
        COALESCE((SELECT SUM(so.quantite_sortie) FROM sortie so JOIN stock s ON so.stock_id = s.id WHERE s.produit_id = p.id), 0) as real_stock
        FROM produit p LIMIT 10
    `);
    console.log("Dynamic stock:", r2.rows);

    process.exit(0);
}
check();
