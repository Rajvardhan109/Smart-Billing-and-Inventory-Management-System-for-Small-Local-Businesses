const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const GOOGLE_CLIENT_ID = '904385184412-vq2cbmbljml79012r4iv6gqkod41162v.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { firstName, lastName, storeName, email, password } = req.body;
  
  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, store_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName || '', storeName || 'My Store', email, hashedPassword]
    );

    const newUserId = result.insertId;

    // Seed default products for the new user
    const defaultProducts = [
      ['Basmati Rice 5kg', 'Groceries', 480.00, 25, 5, newUserId],
      ['Toor Dal 1kg', 'Groceries', 140.00, 40, 8, newUserId],
      ['Sunflower Oil 1L', 'Groceries', 165.00, 3, 5, newUserId],
      ['Colgate Toothpaste 100g', 'Personal Care', 55.00, 30, 10, newUserId],
      ['Parle-G Biscuit 200g', 'Snacks', 20.00, 4, 10, newUserId],
      ['Amul Milk 500ml', 'Dairy', 30.00, 60, 15, newUserId]
    ];
    await pool.query(
      'INSERT INTO products (name, category, price, quantity, low_stock_threshold, user_id) VALUES ?',
      [defaultProducts]
    );

    const token = jwt.sign({ userId: newUserId, email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newUserId, firstName, email, storeName } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, firstName: user.first_name, email: user.email, storeName: user.store_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    let user;
    if (users.length > 0) {
      user = users[0];
    } else {
      // Create new user automatically for Google Sign In
      // Google users don't have a password in our DB, so we use a dummy hash
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const storeName = `${given_name}'s Store`;
      const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, store_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
        [given_name, family_name || '', storeName, email, dummyPassword]
      );
      user = { id: result.insertId, first_name: given_name, email: email, store_name: storeName };

      // Seed default products for the new Google user
      const defaultProducts = [
        ['Basmati Rice 5kg', 'Groceries', 480.00, 25, 5, user.id],
        ['Toor Dal 1kg', 'Groceries', 140.00, 40, 8, user.id],
        ['Sunflower Oil 1L', 'Groceries', 165.00, 3, 5, user.id],
        ['Colgate Toothpaste 100g', 'Personal Care', 55.00, 30, 10, user.id],
        ['Parle-G Biscuit 200g', 'Snacks', 20.00, 4, 10, user.id],
        ['Amul Milk 500ml', 'Dairy', 30.00, 60, 15, user.id]
      ];
      await pool.query(
        'INSERT INTO products (name, category, price, quantity, low_stock_threshold, user_id) VALUES ?',
        [defaultProducts]
      );
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, firstName: user.first_name, email: user.email, storeName: user.store_name } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  const { email, firstName, lastName, storeName } = req.body;
  
  if (!email || !firstName) {
    return res.status(400).json({ error: 'Email and First Name are required.' });
  }

  try {
    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, store_name = ? WHERE email = ?',
      [firstName, lastName || '', storeName || 'My Store', email]
    );

    // Fetch updated user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = users[0];
    res.json({ user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, storeName: user.store_name } });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
