const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'erp_secret_key_change_me', { expiresIn: '1h' });

fetch('http://localhost:5000/api/dashboard/stats?range=7days', {
    headers: { 'Authorization': `Bearer ${token}` }
}).then(async res => {
    console.log("HTTP STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE DATA:");
    try {
        console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
        console.log(text);
    }
}).catch(err => {
    console.error("HTTP ERROR:", err.message);
});
