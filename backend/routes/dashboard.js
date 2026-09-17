const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  const userId = req.user.userId;
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products WHERE user_id = ?', [userId]);

    const [[{ lowStockCount }]] = await pool.query(
      'SELECT COUNT(*) AS lowStockCount FROM products WHERE user_id = ? AND quantity <= low_stock_threshold', [userId]
    );

    const [lowStockProducts] = await pool.query(
      'SELECT id, name, category, price, quantity, low_stock_threshold FROM products WHERE user_id = ? AND quantity <= low_stock_threshold ORDER BY quantity ASC LIMIT 10', [userId]
    );

    const [[{ todaySalesCount, todayRevenue }]] = await pool.query(
      `SELECT COUNT(*) AS todaySalesCount, COALESCE(SUM(total_amount), 0) AS todayRevenue
       FROM sales WHERE user_id = ? AND DATE(created_at) = CURDATE()`, [userId]
    );

    const [recentSales] = await pool.query(
      'SELECT id, invoice_number, customer_name, total_amount, payment_method, created_at FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 8', [userId]
    );

    res.json({
      totalProducts,
      lowStockCount,
      lowStockProducts,
      todaySalesCount,
      todayRevenue: Number(todayRevenue),
      recentSales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard summary.' });
  }
});

module.exports = router;
