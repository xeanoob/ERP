const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(
            "INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES ('Admin', 'admin@erp.local', $1, 'manager') ON CONFLICT DO NOTHING",
            [hash]
        );
        console.log('Admin user seeded (or already exists).');
    } catch (err) {
        console.error('Error seeding admin user:', err);
    } finally {
        await pool.end();
    }
}

seedAdmin();
