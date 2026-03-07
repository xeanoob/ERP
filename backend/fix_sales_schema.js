require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sortie'");
        const columns = res.rows.map(r => r.column_name);
        console.log('Columns in sortie:', columns);

        if (!columns.includes('created_by')) {
            console.log('Adding created_by to sortie...');
            await pool.query('ALTER TABLE sortie ADD COLUMN created_by INTEGER REFERENCES utilisateur(id)');
            console.log('Column added.');
        } else {
            console.log('created_by already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
check();
