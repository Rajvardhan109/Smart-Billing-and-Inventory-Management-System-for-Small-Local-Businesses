const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const billingRoutes = require('./routes/billing');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes); // Auth is public
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend (vanilla HTML/CSS/JS) as static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Smart Billing & Inventory server running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
