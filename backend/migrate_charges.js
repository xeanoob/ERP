const pool = require('./db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS charge_fixe (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(150) NOT NULL,
                montant NUMERIC(10,2) NOT NULL,
                periode VARCHAR(20) DEFAULT 'mensuel' CHECK (periode IN ('mensuel', 'jour')),
                actif BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table charge_fixe created.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
migrate();
