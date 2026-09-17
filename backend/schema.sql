-- Smart Billing and Inventory Management System
-- Run this once against your MySQL server to create the database and tables:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS smart_billing;
USE smart_billing;

-- Products / inventory
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- One row per bill generated
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone VARCHAR(20),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Cash','Card','UPI') NOT NULL DEFAULT 'Cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Line items belonging to a sale
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- A few sample products so the dashboard isn't empty on first run
INSERT INTO products (name, category, price, quantity, low_stock_threshold) VALUES
('Basmati Rice 5kg', 'Groceries', 480.00, 25, 5),
('Toor Dal 1kg', 'Groceries', 140.00, 40, 8),
('Sunflower Oil 1L', 'Groceries', 165.00, 3, 5),
('Colgate Toothpaste 100g', 'Personal Care', 55.00, 30, 10),
('Parle-G Biscuit 200g', 'Snacks', 20.00, 4, 10),
('Amul Milk 500ml', 'Dairy', 30.00, 60, 15);

-- Users (Auth)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  store_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
