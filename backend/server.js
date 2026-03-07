const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const pool = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy (Render)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Global Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use(limiter);

// Specific Rate Limiter for Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, // Max 10 attempts per 15 minutes
    message: { error: 'Trop de tentatives de connexion, veuillez patienter 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/lots', require('./routes/lots'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));

// Health check route for Render
app.get('/', (req, res) => {
    res.json({ status: 'API ERP Marché is running' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    // Internal keep-alive ping (helps but doesn't fully replace external pings)
    setInterval(() => {
        const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        require('http').get(`${url}/`, res => {
            console.log(`[Keep-Alive] Pinged self. Status: ${res.statusCode}`);
        }).on('error', err => {
            console.error(`[Keep-Alive] Ping failed:`, err.message);
        });
    }, 10 * 60 * 1000); // 10 minutes
});
