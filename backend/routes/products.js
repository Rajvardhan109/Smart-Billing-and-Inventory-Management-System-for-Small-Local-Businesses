const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const lowStockOnly = req.query.lowStock === '1' || req.query.lowStock === 'true';
    const sql = lowStockOnly
      ? 'SELECT * FROM products WHERE user_id = ? AND quantity <= low_stock_threshold ORDER BY quantity ASC'
      : 'SELECT * FROM products WHERE user_id = ? ORDER BY name ASC';
    const [rows] = await pool.query(sql, [req.user.userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  const { name, category, price, cost_price, quantity, low_stock_threshold } = req.body;
  if (!name || price == null || quantity == null) {
    return res.status(400).json({ error: 'Name, price, and quantity are required.' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, category, price, cost_price, quantity, low_stock_threshold, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category || 'General', price, cost_price || 0, quantity, low_stock_threshold || 5, req.user.userId]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  const { name, category, price, cost_price, quantity, low_stock_threshold } = req.body;
  
  try {
    const [current] = await pool.query('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (current.length === 0) return res.status(404).json({ error: 'Product not found.' });
    
    await pool.query(
      'UPDATE products SET name = ?, category = ?, price = ?, cost_price = ?, quantity = ?, low_stock_threshold = ? WHERE id = ?',
      [
        name ?? current[0].name,
        category ?? current[0].category,
        price ?? current[0].price,
        cost_price ?? current[0].cost_price,
        quantity ?? current[0].quantity,
        low_stock_threshold ?? current[0].low_stock_threshold,
        req.params.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
