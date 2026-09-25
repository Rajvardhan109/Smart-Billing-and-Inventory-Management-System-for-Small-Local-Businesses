const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

// GET /api/employees (List employees)
router.get('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view employees.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, created_at FROM users WHERE owner_id = ? AND role = "cashier"',
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// POST /api/employees (Create new cashier)
router.post('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create employees.' });
  }
  
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Fetch the admin's store name
    const [adminRows] = await pool.query('SELECT store_name FROM users WHERE id = ?', [req.user.userId]);
    const storeName = adminRows[0].store_name;

    await pool.query(
      'INSERT INTO users (first_name, last_name, store_name, email, password_hash, role, owner_id) VALUES (?, ?, ?, ?, ?, "cashier", ?)',
      [firstName, lastName || '', storeName, email, hashedPassword, req.user.userId]
    );
    res.status(201).json({ message: 'Employee created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete employees.' });
  }
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND owner_id = ? AND role = "cashier"', [req.params.id, req.user.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found.' });
    res.json({ message: 'Employee removed.' });
  } catch (err) {
    constole.error(err);
    res.status(500).json({ error: 'Failed to delete employee.' });
  }
});

module.exports = router;