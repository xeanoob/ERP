const pool = require('./db');
async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, nom, email, role, actif FROM utilisateur');
        console.log("Users in DB:", res.rows);
    } catch (err) {
        console.error("Error fetching users:", err);
    } finally {
        await pool.end();
    }
}
checkUsers();
