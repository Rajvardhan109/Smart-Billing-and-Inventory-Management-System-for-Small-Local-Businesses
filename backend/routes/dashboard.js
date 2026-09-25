const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  const userId = req.user.storeId;
  try {
    const [[{ totalProducts, totalItemsInStock }]] = await pool.query('SELECT COUNT(*) AS totalProducts, COALESCE(SUM(quantity), 0) AS totalItemsInStock FROM products WHERE user_id = ?', [userId]);

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
    
    const [[{ allTimeSales, allTimeProfit }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS allTimeSales, COALESCE(SUM(total_profit), 0) AS allTimeProfit FROM sales WHERE user_id = ?`, [userId]
    );

    const [recentSales] = await pool.query(
      'SELECT id, invoice_number, customer_name, total_amount, payment_method, created_at FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 8', [userId]
    );

    res.json({
      totalProducts,
      totalItemsInStock: Number(totalItemsInStock),
      lowStockCount,
      lowStockProducts,
      todaySalesCount,
      todayRevenue: Number(todayRevenue),
      allTimeSales: Number(allTimeSales),
      allTimeProfit: Number(allTimeProfit),
      recentSales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard summary.' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', async (req, res) => {
  const userId = req.user.storeId;
  try {
    // Sales grouped by date (last 30 days)
    const [salesByDate] = await pool.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as sales, SUM(total_profit) as profit 
       FROM sales 
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
       GROUP BY DATE(created_at) 
       ORDER BY date ASC`, [userId]
    );

    // Sales grouped by month (last 12 months)
    const [salesByMonth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as sales, SUM(total_profit) as profit 
       FROM sales 
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) 
       GROUP BY month 
       ORDER BY month ASC`, [userId]
    );

    res.json({ salesByDate, salesByMonth });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

module.exports = router;
