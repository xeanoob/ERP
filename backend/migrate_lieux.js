const pool = require('./db');

async function migrateLieuxVente() {
    try {
        console.log("Starting DB migration for Lieux de Vente...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lieu_vente (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                actif BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("lieu_vente table created or already exists.");

        // Add lieu_vente_id to sortie table
        try {
            await pool.query('ALTER TABLE sortie ADD COLUMN lieu_vente_id INTEGER REFERENCES lieu_vente(id);');
            console.log("Added lieu_vente_id column to sortie table.");
        } catch (e) {
            if (e.code === '42701') {
                console.log("Column lieu_vente_id already exists in sortie table.");
            } else {
                throw e;
            }
        }

        console.log("Migration successful.");
    } catch(err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrateLieuxVente();
