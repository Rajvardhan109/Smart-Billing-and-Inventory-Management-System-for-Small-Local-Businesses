const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

function authenticateToken(req, res, next) {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) token = authHeader.split(' ')[1]; // "Bearer TOKEN"
  if (!token && req.query.token) token = req.query.token;

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // { userId: 1, email: '...' }
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = authenticateToken;
