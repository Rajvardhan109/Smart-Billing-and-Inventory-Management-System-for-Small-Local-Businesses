const PDFDocument = require('pdfkit');
require('dotenv').config();

const SHOP = {
  name: process.env.SHOP_NAME || 'My Local Store',
  address: process.env.SHOP_ADDRESS || '',
  phone: process.env.SHOP_PHONE || '',
  gstin: process.env.SHOP_GSTIN || ''
};

const rupee = (n) => `Rs. ${Number(n).toFixed(2)}`;

/**
 * Builds a narrow, receipt-style PDF invoice and streams it directly to the response.
 */
function streamInvoicePDF(res, sale, items) {
  // Height grows with the number of line items
  const baseHeight = 250;
  const perItemHeight = 14;
  const extraForDiscount = Number(sale.discount) > 0 ? 16 : 0;
  const pageHeight = baseHeight + items.length * perItemHeight + extraForDiscount;

  // Narrow width mimics a till receipt
  const doc = new PDFDocument({ size: [280, pageHeight], margin: 16 });
  
  // Set response headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${sale.invoice_number}.pdf"`);
  
  // Pipe directly to the HTTP response
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(14).text(SHOP.name, { align: 'center' });
  doc.font('Helvetica').fontSize(8);
  if (SHOP.address) doc.text(SHOP.address, { align: 'center' });
  if (SHOP.phone) doc.text(`Ph: ${SHOP.phone}`, { align: 'center' });
  if (SHOP.gstin) doc.text(`GSTIN: ${SHOP.gstin}`, { align: 'center' });

  doc.moveDown(0.5);
  dashedLine(doc);

  doc.fontSize(9).font('Helvetica-Bold').text(`Invoice: ${sale.invoice_number}`);
  doc.font('Helvetica').text(`Date: ${new Date(sale.created_at || Date.now()).toLocaleString('en-IN')}`);
  doc.text(`Customer: ${sale.customer_name || 'Walk-in Customer'}`);
  if (sale.customer_phone) doc.text(`Phone: ${sale.customer_phone}`);
  doc.text(`Payment: ${sale.payment_method}`);

  dashedLine(doc);

  doc.font('Helvetica-Bold');
  row(doc, 'Item', 'Qty', 'Rate', 'Amt', true);
  doc.font('Helvetica');
  dashedLine(doc);

  items.forEach((item) => {
    row(doc, item.product_name, String(item.quantity), Number(item.unit_price).toFixed(2), Number(item.subtotal).toFixed(2));
  });

  dashedLine(doc);
  doc.font('Helvetica').fontSize(9);
  kv(doc, 'Subtotal', rupee(sale.subtotal));
  if (Number(sale.discount) > 0) kv(doc, 'Discount', `- ${rupee(sale.discount)}`);
  doc.font('Helvetica-Bold').fontSize(11);
  kv(doc, 'TOTAL', rupee(sale.total_amount));

  dashedLine(doc);
  doc.font('Helvetica').fontSize(8).text('Thank you for shopping with us!', { align: 'center' });
  doc.text('Goods once sold are not returnable.', { align: 'center' });

  doc.end();
}

function dashedLine(doc) {
  const y = doc.y + 2;
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .dash(2, { space: 2 })
    .stroke();
  doc.undash();
  doc.moveDown(0.6);
}

function row(doc, item, qty, rate, amt, isHeader = false) {
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.fontSize(isHeader ? 8 : 8.5);
  doc.text(item, doc.page.margins.left, y, { width: width * 0.42 });
  const rowY = doc.y > y ? y : doc.y;
  doc.text(qty, doc.page.margins.left + width * 0.44, y, { width: width * 0.14, align: 'right' });
  doc.text(rate, doc.page.margins.left + width * 0.60, y, { width: width * 0.18, align: 'right' });
  doc.text(amt, doc.page.margins.left + width * 0.80, y, { width: width * 0.20, align: 'right' });
  doc.y = Math.max(doc.y, y + 12);
}

function kv(doc, label, value) {
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.text(label, doc.page.margins.left, y, { width: width * 0.5 });
  doc.text(value, doc.page.margins.left + width * 0.5, y, { width: width * 0.5, align: 'right' });
  doc.moveDown(0.3);
}

module.exports = { streamInvoicePDF };
