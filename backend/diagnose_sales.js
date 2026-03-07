require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function diagnose() {
    console.log('--- Database Diagnostics ---');
    try {
        // 1. Check tables columns
        const tables = ['produit', 'stock', 'sortie', 'utilisateur'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`\nTable: ${table}`);
            res.rows.forEach(row => {
                console.log(` - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
            });
        }

        // 2. Check for a valid product and stock
        const stockCheck = await pool.query(`
            SELECT s.id as stock_id, p.id as produit_id, p.nom, s.quantite_achetee,
            s.quantite_achetee - COALESCE((SELECT SUM(so.quantite_sortie) FROM sortie so WHERE so.stock_id = s.id), 0) as restant
            FROM stock s
            JOIN produit p ON s.produit_id = p.id
            WHERE p.actif = TRUE
            LIMIT 1
        `);

        if (stockCheck.rows.length === 0) {
            console.log('\nWarning: No active stock found to test.');
            process.exit(0);
        }

        const testData = stockCheck.rows[0];
        console.log(`\nAttempting test sale for product: ${testData.nom} (ID: ${testData.produit_id}) from stock ID: ${testData.stock_id}`);

        // 3. Simulate sale transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Try to insert a test sale (record from first user)
            const userRes = await client.query('SELECT id FROM utilisateur LIMIT 1');
            const userId = userRes.rows[0]?.id || null;

            console.log(`Using User ID: ${userId} for test`);

            const insertRes = await client.query(
                'INSERT INTO sortie (stock_id, quantite_sortie, prix_reel, created_by) VALUES($1, $2, $3, $4) RETURNING *',
                [testData.stock_id, 0.1, 10, userId]
            );
            console.log('Insert test sale SUCCESS');

            await client.query('ROLLBACK');
            console.log('Transaction Rolled Back (Clean test)');
        } catch (err) {
            console.error('\n!!! ERROR DURING TEST SALE !!!');
            console.error(err.message);
            console.error(err.detail || 'No extra detail');
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Diagnostic failed:', err);
    }
    process.exit(0);
}

diagnose();
