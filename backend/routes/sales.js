const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/sales -> all sales, newest first, optional ?limit=
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const [rows] = await pool.query(
      'SELECT * FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [req.user.userId, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales history.' });
  }
});

// GET /api/sales/:id -> a single sale with its line items
router.get('/:id', async (req, res) => {
  try {
    const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (saleRows.length === 0) return res.status(404).json({ error: 'Sale not found.' });

    const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    res.json({ ...saleRows[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sale.' });
  }
});

module.exports = router;
