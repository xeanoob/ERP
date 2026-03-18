const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');


router.get('/', verifyToken, async (req, res) => {
    try {
        const { includeArchived, search, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;

        let whereClause = includeArchived === 'true' ? '' : 'WHERE p.actif = true';
        const params = [];
        let paramIdx = 1;

        if (search) {
            const searchCondition = `(p.nom ILIKE $${paramIdx} OR c.nom ILIKE $${paramIdx} OR p.origine ILIKE $${paramIdx})`;
            whereClause = whereClause ? `${whereClause} AND ${searchCondition}` : `WHERE ${searchCondition}`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM produit p LEFT JOIN categorie c ON p.categorie_id = c.id ${whereClause}`, params
        );
        const total = parseInt(countRes.rows[0].count);

        const dataRes = await pool.query(
            `SELECT p.*, c.nom as categorie_nom, t.nom as tauxTva_nom, t.taux as tauxTva_taux 
             FROM produit p 
             LEFT JOIN categorie c ON p.categorie_id = c.id 
             LEFT JOIN tauxTva t ON p.taux_tva_id = t.id
             ${whereClause} 
             ORDER BY p.nom ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limitNum, offset]
        );

        res.json({
            data: dataRes.rows,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { nom, categorie_id, taux_tva_id, origine, unite, prix_actif, seuil_alerte_stock } = req.body;
        const result = await pool.query(
            'INSERT INTO produit (nom, categorie_id, taux_tva_id, origine, unite, prix_actif, seuil_alerte_stock, created_by) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nom, categorie_id || null, taux_tva_id || null, origine, unite || 'kg', prix_actif || 0, seuil_alerte_stock || 10, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.put('/:id', verifyToken, requireRole('manager', 'stock'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, categorie_id, taux_tva_id, origine, unite, prix_actif, seuil_alerte_stock } = req.body;
        const result = await pool.query(
            'UPDATE produit SET nom=$1, categorie_id=$2, taux_tva_id=$3, origine=$4, unite=$5, prix_actif=$6, seuil_alerte_stock=$7, updated_by=$8 WHERE id=$9 RETURNING *',
            [nom, categorie_id, taux_tva_id, origine, unite, prix_actif, seuil_alerte_stock, req.user.id, id]
        );
        if (result.rows.length === 0) return res.status(404).json('Product not found');
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.get('/alerts', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.nom, p.quantite_stock, p.seuil_alerte_stock, c.nom as categorie_nom
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id
            WHERE p.actif = TRUE AND p.quantite_stock <= p.seuil_alerte_stock
            ORDER BY p.nom ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.delete('/:id', verifyToken, requireRole('manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE produit SET actif = FALSE WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json('Product not found');
        res.json({ message: 'Product archived', product: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
