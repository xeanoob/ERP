const pool = require('./db');
const bcrypt = require('bcryptjs');

async function forceUpdateAdmin() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(
            "UPDATE utilisateur SET mot_de_passe = $1 WHERE email = 'admin@erp.local'",
            [hash]
        );
        console.log('Admin password forcefully updated to admin123');
    } catch (err) {
        console.error('Error updating admin password:', err);
    } finally {
        await pool.end();
    }
}

forceUpdateAdmin();
