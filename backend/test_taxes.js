const pool = require('./db');

async function testTaxes() {
    try {
        const id = 1;
        
        console.log('Testing PUT /api/taxes/1/default logic...');
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE taxe SET is_default = FALSE');
            const result = await client.query('UPDATE taxe SET is_default = TRUE WHERE id = $1 RETURNING *', [id]);
            await client.query('COMMIT');
            if (result.rows.length === 0) {
                console.log('Result: Taxe non trouvée.');
            } else {
                console.log('Result: Success -', result.rows[0]);
            }
        } catch(err) {
            await client.query('ROLLBACK');
            console.error('Inner Error:', err.message);
        } finally {
            client.release();
        }
        
    } catch(err) {
        console.error('Outer Error:', err);
    } finally {
        pool.end();
    }
}
testTaxes();
