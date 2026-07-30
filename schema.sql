-- Schema SQL for Dzakirah Bouquet PostgreSQL Database

-- Drop tables if exists
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- 1. Table Admin Users
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT 'Admin Dzakirah',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '💐'
);

-- 3. Table Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_slug VARCHAR(50) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE SET NULL,
    price INT NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    badge VARCHAR(50) DEFAULT 'Ready Stock',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table Orders (WhatsApp Order History)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    use_date DATE NOT NULL,
    shipping_method VARCHAR(100) NOT NULL,
    wrap_color VARCHAR(50) DEFAULT 'Pink Soft',
    card_to VARCHAR(100),
    card_from VARCHAR(100),
    card_message TEXT,
    addons TEXT,
    total_price INT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Diproses', 'Selesai', 'Batal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA

-- Default Admin User (username: admin, password: admin123 - bcrypt hash below)
INSERT INTO admin_users (username, password_hash, name)
VALUES (
    'admin', 
    '$2a$10$t6GqdPcHD37OAzFs7ErYn.fdqVLkoa4u6sIVqBpzfYmXhOSneJm42', 
    'Pemilik Dzakirah'
);

-- Categories
INSERT INTO categories (slug, name, icon) VALUES
('artificial', 'Bunga Artificial', '🌸'),
('snack-money', 'Snack & Uang', '🍫'),
('graduation', 'Wisuda & Boneka', '🎓');

-- Initial Products
INSERT INTO products (name, category_slug, price, image_url, badge, is_active) VALUES
('Artificial Flower Bouquet (L)', 'artificial', 65000, 'images/Cover.jpg', 'Ready Stock', true),
('Rose Purple Bouquet (XS)', 'artificial', 65000, 'images/Cover2.jpg', 'Best Seller', true),
('Artificial Rose Bouquet (M)', 'artificial', 55000, 'images/Cover3.jpg', 'Favorit', true),
('Artificial Flower Pink (L)', 'artificial', 60000, 'images/Cover4.jpg', 'Ready Stock', true),
('Artificial Flower Mini (XS)', 'artificial', 25000, 'images/Cover5.jpg', 'Hemat', true),
('Artificial Flower Golden (L)', 'artificial', 65000, 'images/Cover6.jpg', 'Elegan', true),
('Buket Uang & Snack Combo', 'snack-money', 85000, 'images/Cover7.jpg', 'Popular', true),
('Graduation Doll Bouquet (M)', 'graduation', 70000, 'images/Cover8.jpg', 'Wisuda Best', true),
('Chocolatos Snack Bouquet', 'snack-money', 25000, 'images/Cover9.jpg', 'Hemat', true),
('Snack Bouquet Jumbo (L)', 'snack-money', 35000, 'images/Cover10.jpg', 'Best Seller', true),
('Buket Bantal Custom (L)', 'graduation', 75000, 'images/Cover11.jpg', 'Special Gift', true),
('Snack Bouquet Medium (M)', 'snack-money', 30000, 'images/Cover12.jpg', 'Ready Stock', true);
