const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testPutRoute() {
    const token = jwt.sign(
        { id: 1, role: 'manager', nom: 'Admin' },
        'une_phrase_secrete_tres_longue_12345!',
        { expiresIn: '8h' }
    );

    try {
        const res = await axios.put('http://localhost:5000/api/taxes/1/default', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("SUCCESS:", res.data);
    } catch (err) {
        if (err.response) {
            console.error("ERROR DATA:", err.response.data);
            console.error("STATUS:", err.response.status);
        } else {
            console.error("ERROR:", err.message);
        }
    }
}

testPutRoute();
