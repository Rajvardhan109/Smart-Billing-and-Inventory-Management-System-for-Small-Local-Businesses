# Smart Billing and Inventory Management System

A web-based billing and inventory system for small local businesses — digitize
billing, manage stock, and get low-stock alerts, replacing notebooks and
spreadsheets.

**Stack:** HTML/CSS/JavaScript (frontend) · Node.js + Express (backend) ·
MySQL (database) · PDFKit (invoice generation)

## Features

- **Product / inventory management** — add, edit, delete products with price,
  stock quantity, and a low-stock threshold.
- **Billing** — pick products into a cart, apply a discount, choose a payment
  method (Cash / UPI / Card), and generate a bill.
- **Automatic stock updates** — selling a product deducts it from inventory
  immediately, inside a database transaction (a sale never partially applies).
- **Low-stock alerts** — dashboard and product list flag anything at or below
  its threshold.
- **PDF invoices** — every bill generates a printable receipt-style PDF.
- **Sales history** — every past bill, with a link to re-download its invoice.
- **Dashboard** — today's sales count and revenue, total products, low-stock
  count, and recent transactions.

## Project structure

```
smart-billing-inventory/
├── backend/
│   ├── config/db.js          MySQL connection pool
│   ├── routes/                products.js, billing.js, sales.js, dashboard.js
│   ├── utils/invoicePDF.js    Generates the receipt-style PDF invoice
│   ├── invoices/               Generated PDFs land here at runtime
│   ├── schema.sql              Database schema + sample seed data
│   ├── server.js               Express app entry point
│   ├── .env.example             Copy to .env and fill in your own values
│   └── package.json
└── frontend/
    ├── index.html               Dashboard
    ├── products.html            Product / inventory management
    ├── billing.html              New bill / checkout
    ├── sales.html                Sales history
    ├── css/style.css
    └── js/                       api.js + one file per page
```

The frontend is plain HTML/CSS/JS with no build step — Express serves it
directly as static files, so the whole app runs from a single Node process.

## Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org) 18+
- [MySQL](https://dev.mysql.com/downloads/) 8.x (or a MariaDB equivalent)

### 2. Create the database
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `smart_billing` database, its three tables
(`products`, `sales`, `sale_items`), and seeds a handful of sample products
so the dashboard isn't empty on first run.

### 3. Configure environment variables
```bash
cd backend
cp .env.example .env
```
Edit `.env` with your MySQL credentials and (optionally) your shop's name,
address, phone and GSTIN — these appear on the printed invoice.

### 4. Install dependencies and run
```bash
cd backend
npm install
npm start
```
The app is now running at **http://localhost:5000** — Express serves both
the API (`/api/...`) and the frontend from the same port.

For development with auto-restart on file changes:
```bash
npm run dev
```

## API reference

| Method | Endpoint                                   | Purpose                              |
|--------|---------------------------------------------|---------------------------------------|
| GET    | `/api/products`                             | List all products                     |
| GET    | `/api/products?lowStock=1`                  | List only low-stock products          |
| POST   | `/api/products`                             | Add a product                         |
| PUT    | `/api/products/:id`                         | Update a product                      |
| DELETE | `/api/products/:id`                         | Remove a product                      |
| POST   | `/api/billing`                              | Create a bill (deducts stock, makes PDF) |
| GET    | `/api/billing/invoice/:invoiceNumber/pdf`   | Download/view an invoice PDF          |
| GET    | `/api/sales`                                | Sales history                         |
| GET    | `/api/sales/:id`                            | One sale, with its line items         |
| GET    | `/api/dashboard/summary`                    | Today's stats + low-stock list        |

### Example: creating a bill
```json
POST /api/billing
{
  "customerName": "Ramesh Kumar",
  "customerPhone": "9876500000",
  "paymentMethod": "UPI",
  "discount": 10,
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 6, "quantity": 3 }
  ]
}
```
Stock is checked and locked for every line before anything is written, so a
bill either succeeds completely or fails completely — inventory is never left
half-updated.

## Notes on this build

- Invoice numbers follow `INV-YYYYMMDD-NNNN`, resetting the sequence each day.
- Invoice PDFs are sized to the number of line items, like a real till
  receipt, rather than a fixed A4 page.
- This was built and tested end-to-end during development (products, billing
  with stock deduction, PDF generation, sales history and the dashboard were
  all verified against a live MySQL instance).
