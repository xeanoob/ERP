const pool = require('./db');

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'taxe';");
        console.log("Columns in taxe:");
        console.table(res.rows);
        
        const res2 = await pool.query("SELECT * FROM taxe;");
        console.log("Data in taxe:");
        console.table(res2.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
