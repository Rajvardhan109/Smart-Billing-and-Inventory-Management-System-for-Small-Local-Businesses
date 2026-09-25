const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { streamInvoicePDF } = require('../utils/invoicePDF');

// Generates a same-day-unique, human-readable invoice number, e.g. INV-20260907-0007
async function nextInvoiceNumber(connection, userId) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS cnt FROM sales WHERE invoice_number LIKE ? AND user_id = ?",
    [`INV-${datePart}-%`, userId]
  );
  const seq = String(rows[0].cnt + 1).padStart(4, '0');
  return `INV-${datePart}-${seq}`;
}

// POST /api/billing
router.post('/', async (req, res) => {
  const { customerName, customerPhone, paymentMethod, discount, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required to create a bill.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const resolvedItems = [];
    for (const line of items) {
      const [rows] = await connection.query('SELECT * FROM products WHERE id = ? AND user_id = ? FOR UPDATE', [line.productId, req.user.storeId]);
      if (rows.length === 0) {
        throw new Error(`Product #${line.productId} does not exist or you don't have access.`);
      }
      const product = rows[0];
      const quantity = Number(line.quantity);
      if (!quantity || quantity <= 0) {
        throw new Error(`Invalid quantity for ${product.name}.`);
      }
      if (product.quantity < quantity) {
        throw new Error(`Not enough stock for ${product.name}. Only ${product.quantity} left.`);
      }
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.price),
        costPrice: Number(product.cost_price || 0),
        quantity,
        subtotal: Number(product.price) * quantity
      });
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const totalCost = resolvedItems.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
    const discountAmt = Number(discount) || 0;
    const totalAmount = Math.max(subtotal - discountAmt, 0);
    const totalProfit = totalAmount - totalCost;
    const invoiceNumber = await nextInvoiceNumber(connection, req.user.storeId);

    const [saleResult] = await connection.query(
      `INSERT INTO sales (invoice_number, customer_name, customer_phone, subtotal, discount, total_amount, total_profit, payment_method, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        customerName || 'Walk-in Customer',
        customerPhone || null,
        subtotal,
        discountAmt,
        totalAmount,
        totalProfit,
        paymentMethod || 'Cash',
        req.user.storeId
      ]
    );
    const saleId = saleResult.insertId;

    for (const item of resolvedItems) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, item.productId, item.name, item.unitPrice, item.quantity, item.subtotal]
      );
      await connection.query('UPDATE products SET quantity = quantity - ? WHERE id = ? AND user_id = ?', [item.quantity, item.productId, req.user.storeId]);
    }

    await connection.commit();

    const sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || null,
      subtotal,
      discount: discountAmt,
      total_amount: totalAmount,
      payment_method: paymentMethod || 'Cash',
      created_at: new Date(),
      user_id: req.user.storeId
    };

    res.status(201).json({
      sale,
      items: resolvedItems,
      pdfUrl: `/api/billing/invoice/${invoiceNumber}/pdf`
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to create bill.' });
  } finally {
    connection.release();
  }
});

// GET /api/billing/invoice/:invoiceNumber/pdf
router.get('/invoice/:invoiceNumber/pdf', async (req, res) => {
  try {
    const [sales] = await pool.query('SELECT * FROM sales WHERE invoice_number = ? AND user_id = ?', [req.params.invoiceNumber, req.user.storeId]);
    if (sales.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    
    const sale = sales[0];
    const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    
    // Stream directly to the HTTP response to bypass Vercel's Read-Only File System
    streamInvoicePDF(res, sale, items);
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    res.status(500).json({ error: 'Internal server error while generating PDF.' });
  }
});

module.exports = router;
