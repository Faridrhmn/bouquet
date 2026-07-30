-- Migration 002: Business Features Expansion
-- Adds stock management, cost price (HPP), payment tracking, reviews, and store settings

-- 1. Extend products table with stock_quantity, cost_price, and description
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 10 CHECK (stock_quantity >= 0),
ADD COLUMN IF NOT EXISTS cost_price INT DEFAULT 0 CHECK (cost_price >= 0),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update cost_price defaults for existing seed products if cost_price is 0
UPDATE products SET cost_price = ROUND(price * 0.6) WHERE cost_price = 0 OR cost_price IS NULL;

-- 2. Extend orders table with payment and tracking fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'WhatsApp / Manual',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'Unpaid',
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS qris_code_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;

-- Add check constraint for payment_status safely
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('Unpaid', 'Paid', 'Refunded'));
    END IF;
END $$;

-- 3. Create product_reviews table for User Generated Content (UGC)
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    order_code VARCHAR(20),
    customer_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create store_settings table for QRIS / Account Info
CREATE TABLE IF NOT EXISTS store_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial store settings if not exists
INSERT INTO store_settings (setting_key, setting_value)
VALUES 
('qris_image', 'images/sample-qris.png'),
('qris_merchant_name', 'Dzakirah Bouquet Jogja'),
('bank_account_info', 'BCA: 1234567890 a/n Dzakirah Bouquet'),
('whatsapp_number', '6281234567890')
ON CONFLICT (setting_key) DO NOTHING;

-- Seed initial product reviews if table empty
INSERT INTO product_reviews (product_id, customer_name, rating, comment, photo_url)
SELECT p.id, r.customer_name, r.rating, r.comment, r.photo_url
FROM products p
CROSS JOIN (VALUES 
    ('Siti Rahma', 5, 'Buket bunganya cantik banget! Kertas wrappingnya rapi dan warnanya lembut. Cocok banget buat wisuda pacar.', 'images/Cover8.jpg'),
    ('Budi Santoso', 5, 'Respon penjual sangat cepat. Order H-1 wisuda tetap dilayani dengan sangat baik. Recommended seller Jogja!', 'images/Cover2.jpg'),
    ('Anisa Putri', 4, 'Buket snacknya rapi, warnanya estetik. Kartu ucapannya juga dicetak rapi. Terima kasih Dzakirah!', 'images/Cover7.jpg')
) AS r(customer_name, rating, comment, photo_url)
WHERE p.id IN (SELECT id FROM products ORDER BY id ASC LIMIT 3)
AND NOT EXISTS (SELECT 1 FROM product_reviews LIMIT 1);
