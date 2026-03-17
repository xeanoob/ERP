const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'erp_secret_key_change_me';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
<<<<<<< HEAD
    const token = authHeader && authHeader.split(' ')[1];
=======
    const token = authHeader && authHeader.split(' ')[1]; 
>>>>>>> 85e3b8fed3629a50333611da3fa29c0abaa8f4d2

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token invalide ou expiré.' });
    }
};

<<<<<<< HEAD
=======

>>>>>>> 85e3b8fed3629a50333611da3fa29c0abaa8f4d2
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès interdit pour ce rôle.' });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole, JWT_SECRET };
