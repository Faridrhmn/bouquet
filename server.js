const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dzakirah_secret_key_default';

// Ensure upload folders exist
const uploadsProductDir = path.join(__dirname, 'uploads', 'products');
const uploadsProofDir = path.join(__dirname, 'uploads', 'proofs');
const uploadsCompletionDir = path.join(__dirname, 'uploads', 'completions');
const uploadsReviewDir = path.join(__dirname, 'uploads', 'reviews');

[uploadsProductDir, uploadsProofDir, uploadsCompletionDir, uploadsReviewDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// PostgreSQL Connection Pool Configuration
const poolConfig = {
    database: process.env.PGDATABASE || 'dzakirah_db',
    user: process.env.PGUSER || 'patrick',
};

if (process.env.PGHOST) {
    poolConfig.host = process.env.PGHOST;
} else if (fs.existsSync('/var/run/postgresql')) {
    poolConfig.host = '/var/run/postgresql';
} else {
    poolConfig.host = 'localhost';
}

if (process.env.PGPASSWORD) {
    poolConfig.password = process.env.PGPASSWORD;
}

if (process.env.PGPORT) {
    poolConfig.port = parseInt(process.env.PGPORT);
}

const pool = new Pool(poolConfig);

// Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database PostgreSQL:', err.stack);
    } else {
        console.log('✅ Berhasil terhubung ke database PostgreSQL (dzakirah_db)');
        release();
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files and uploads
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer memory storage for image processing with Sharp
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan!'));
        }
    }
});

// JWT Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
    }
};

// Helper: Convert and Save Image to WebP using Sharp
async function processAndSaveImage(fileBuffer, subfolder = 'products') {
    const targetDir = path.join(__dirname, 'uploads', subfolder);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const filename = `${subfolder}-${Date.now()}-${Math.round(Math.random() * 1e4)}.webp`;
    const outputPath = path.join(targetDir, filename);

    await sharp(fileBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

    return `uploads/${subfolder}/${filename}`;
}

// Helper: Generate Random Order Code
function generateOrderCode() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DZK-${dateStr}-${rand}`;
}

/* ==========================================================================
   ROUTES: AUTHENTICATION
   ========================================================================== */

// Admin Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
    }

    try {
        const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah!' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah!' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: { id: user.id, username: user.username, name: user.name }
        });
    } catch (err) {
        console.error('Error Login:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login.' });
    }
});

// Verify Current Admin Session
app.get('/api/auth/me', authenticateAdmin, (req, res) => {
    res.json({ success: true, user: req.admin });
});

// Update Admin Profile & Login Credentials
app.put('/api/auth/update-profile', authenticateAdmin, async (req, res) => {
    const { username, current_password, new_password, name } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.admin.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User admin tidak ditemukan.' });
        }
        const user = userResult.rows[0];

        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ success: false, message: 'Password saat ini wajib diisi untuk mengubah password!' });
            }
            const isMatch = await bcrypt.compare(current_password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Password saat ini salah!' });
            }
        }

        let newHash = user.password_hash;
        if (new_password && new_password.trim() !== '') {
            newHash = await bcrypt.hash(new_password.trim(), 10);
        }

        const updatedUsername = username && username.trim() !== '' ? username.trim() : user.username;
        const updatedName = name && name.trim() !== '' ? name.trim() : user.name;

        await pool.query(
            'UPDATE users SET username = $1, password_hash = $2, name = $3 WHERE id = $4',
            [updatedUsername, newHash, updatedName, req.admin.id]
        );

        res.json({
            success: true,
            message: 'Profil & Kredensial Login Admin berhasil diperbarui!',
            user: { id: req.admin.id, username: updatedUsername, name: updatedName }
        });
    } catch (err) {
        console.error('Error Update Admin Profile:', err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui profil admin.' });
    }
});

/* ==========================================================================
   ROUTES: CATEGORIES
   ========================================================================== */

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error Get Categories:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data kategori.' });
    }
});

/* ==========================================================================
   ROUTES: PRODUCTS (PUBLIC & ADMIN)
   ========================================================================== */

// GET Products List (Public or Admin)
app.get('/api/products', async (req, res) => {
    const { category, include_inactive } = req.query;
    try {
        let query = 'SELECT * FROM products';
        const params = [];
        const conditions = [];

        if (include_inactive !== 'true') {
            conditions.push('is_active = true');
        }

        if (category && category !== 'all') {
            params.push(category);
            conditions.push(`category_slug = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error Get Products:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil katalog produk.' });
    }
});

// GET Product Detail
app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error Get Product Detail:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail produk.' });
    }
});

// POST Create Product (Admin Only)
app.post('/api/products', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category_slug, price, cost_price, stock_quantity, description, badge, is_active } = req.body;
        if (!name || !category_slug || !price) {
            return res.status(400).json({ success: false, message: 'Nama, kategori, dan harga produk wajib diisi!' });
        }

        let imageUrl = 'images/Cover.jpg';
        if (req.file) {
            imageUrl = await processAndSaveImage(req.file.buffer, 'products');
        } else if (req.body.image_url) {
            imageUrl = req.body.image_url;
        }

        const activeStatus = is_active === 'true' || is_active === true;
        const parsedPrice = parseInt(price);
        const parsedCostPrice = cost_price ? parseInt(cost_price) : Math.round(parsedPrice * 0.6);
        const parsedStock = stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity) : 10;

        const query = `
            INSERT INTO products (name, category_slug, price, cost_price, stock_quantity, description, image_url, badge, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            name, category_slug, parsedPrice, parsedCostPrice, 
            parsedStock, description || '', imageUrl, badge || 'Ready Stock', activeStatus
        ];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Produk berhasil ditambahkan!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Create Product:', err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan produk baru.' });
    }
});

// PUT Update Product (Admin Only)
app.put('/api/products/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
    const productId = req.params.id;
    try {
        const check = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
        }

        const existing = check.rows[0];
        const { name, category_slug, price, cost_price, stock_quantity, description, badge, is_active } = req.body;

        let imageUrl = existing.image_url;
        if (req.file) {
            imageUrl = await processAndSaveImage(req.file.buffer, 'products');
        } else if (req.body.image_url) {
            imageUrl = req.body.image_url;
        }

        const activeStatus = is_active !== undefined ? (is_active === 'true' || is_active === true) : existing.is_active;
        const updatedPrice = price ? parseInt(price) : existing.price;
        const updatedCostPrice = cost_price !== undefined && cost_price !== '' ? parseInt(cost_price) : existing.cost_price;
        const updatedStock = stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity) : existing.stock_quantity;

        const query = `
            UPDATE products
            SET name = $1, category_slug = $2, price = $3, cost_price = $4, stock_quantity = $5, description = $6, image_url = $7, badge = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *
        `;
        const values = [
            name || existing.name,
            category_slug || existing.category_slug,
            updatedPrice,
            updatedCostPrice,
            updatedStock,
            description !== undefined ? description : existing.description,
            imageUrl,
            badge !== undefined ? badge : existing.badge,
            activeStatus,
            productId
        ];

        const result = await pool.query(query, values);
        res.json({
            success: true,
            message: 'Produk berhasil diperbarui!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Update Product:', err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
    }
});

// DELETE Product (Admin Only)
app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
    const productId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Produk berhasil dihapus!' });
    } catch (err) {
        console.error('Error Delete Product:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
    }
});

/* ==========================================================================
   ROUTES: ORDERS (WA ORDER LOG & STATS)
   ========================================================================== */

/* ==========================================================================
   ROUTES: ORDERS & LIVE TRACKING
   ========================================================================== */

// POST Log WhatsApp / Online Order (Public Endpoint)
app.post('/api/orders', async (req, res) => {
    try {
        const {
            customer_name,
            customer_phone,
            use_date,
            shipping_method,
            shipping_cost,
            payment_method,
            wrap_color,
            card_to,
            card_from,
            card_message,
            addons,
            total_price,
            product_id
        } = req.body;

        if (!customer_name || !customer_phone || !use_date || !total_price) {
            return res.status(400).json({ success: false, message: 'Data pemesan dan total harga wajib diisi!' });
        }

        // If product_id provided, check and deduct stock
        if (product_id) {
            const productRes = await pool.query('SELECT id, stock_quantity, name FROM products WHERE id = $1', [product_id]);
            if (productRes.rows.length > 0) {
                const prod = productRes.rows[0];
                if (prod.stock_quantity <= 0) {
                    return res.status(400).json({ success: false, message: `Stok untuk produk "${prod.name}" sedang habis!` });
                }
                // Deduct stock by 1
                await pool.query('UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = $1', [product_id]);
            }
        }

        const orderCode = generateOrderCode();
        const selectedPayment = payment_method || 'WhatsApp / Manual';
        const initialPayStatus = (selectedPayment === 'COD / Ambil di Tempat') ? 'Unpaid' : 'Unpaid';

        const query = `
            INSERT INTO orders (
                order_code, customer_name, customer_phone, use_date, 
                shipping_method, shipping_cost, payment_method, payment_status,
                wrap_color, card_to, card_from, card_message, addons, total_price, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending')
            RETURNING *
        `;
        const values = [
            orderCode, customer_name, customer_phone, use_date,
            shipping_method || 'COD / Ambil di Tempat',
            shipping_cost ? parseInt(shipping_cost) : 0,
            selectedPayment,
            initialPayStatus,
            wrap_color || 'Pink Soft',
            card_to || '', card_from || '', card_message || '',
            addons || 'Tidak Ada', parseInt(total_price)
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dibuat!',
            order_code: orderCode,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Create Order:', err);
        res.status(500).json({ success: false, message: 'Gagal mencatat pesanan baru.' });
    }
});

// GET Track Order Status by Order Code (Public)
app.get('/api/orders/track/:orderCode', async (req, res) => {
    const { orderCode } = req.params;
    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE order_code = $1', [orderCode.toUpperCase()]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Kode pesanan tidak ditemukan. Periksa kembali kode Anda.' });
        }

        // Get Store settings for payment info
        const settingsResult = await pool.query('SELECT setting_key, setting_value FROM store_settings');
        const settings = {};
        settingsResult.rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

        res.json({
            success: true,
            data: orderResult.rows[0],
            store_info: settings
        });
    } catch (err) {
        console.error('Error Track Order:', err);
        res.status(500).json({ success: false, message: 'Gagal melacak pesanan.' });
    }
});

// POST Upload Payment Proof (Public Customer Action)
app.post('/api/orders/:orderCode/upload-proof', upload.single('proof'), async (req, res) => {
    const { orderCode } = req.params;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Harap pilih file bukti pembayaran!' });
        }

        const proofUrl = await processAndSaveImage(req.file.buffer, 'proofs');
        const result = await pool.query(
            `UPDATE orders SET payment_proof_url = $1 WHERE order_code = $2 RETURNING *`,
            [proofUrl, orderCode.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }

        res.json({
            success: true,
            message: 'Bukti pembayaran berhasil diunggah! Admin akan segera mengonfirmasi.',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Upload Payment Proof:', err);
        res.status(500).json({ success: false, message: 'Gagal mengunggah bukti pembayaran.' });
    }
});

// POST Upload Completion Photo (Admin Only)
app.post('/api/orders/:id/upload-completion', authenticateAdmin, upload.single('completion'), async (req, res) => {
    const orderId = req.params.id;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Harap pilih foto buket yang sudah selesai!' });
        }

        const completionUrl = await processAndSaveImage(req.file.buffer, 'completions');
        const result = await pool.query(
            `UPDATE orders SET completion_photo_url = $1 WHERE id = $2 RETURNING *`,
            [completionUrl, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }

        res.json({
            success: true,
            message: 'Foto hasil buket selesai berhasil diunggah!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Upload Completion Photo:', err);
        res.status(500).json({ success: false, message: 'Gagal mengunggah foto hasil buket.' });
    }
});

// GET Orders History & Summary Stats (Admin Only)
app.get('/api/orders', authenticateAdmin, async (req, res) => {
    try {
        const ordersResult = await pool.query('SELECT * FROM orders ORDER BY id DESC');

        const statsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'Diproses' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'Selesai' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_orders
            FROM orders
        `;
        const statsResult = await pool.query(statsQuery);

        res.json({
            success: true,
            stats: statsResult.rows[0],
            data: ordersResult.rows
        });
    } catch (err) {
        console.error('Error Get Orders:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan.' });
    }
});

// PATCH Update Order Status (Admin Only)
app.patch('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Diproses', 'Selesai', 'Batal'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status pesanan tidak valid!' });
    }

    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Status pesanan berhasil diperbarui!', data: result.rows[0] });
    } catch (err) {
        console.error('Error Update Order Status:', err);
        res.status(500).json({ success: false, message: 'Gagal mengubah status pesanan.' });
    }
});

// PATCH Update Order Payment Status (Admin Only)
app.patch('/api/orders/:id/payment-status', authenticateAdmin, async (req, res) => {
    const { payment_status } = req.body;
    const validStatuses = ['Unpaid', 'Paid', 'Refunded'];
    if (!validStatuses.includes(payment_status)) {
        return res.status(400).json({ success: false, message: 'Status pembayaran tidak valid!' });
    }

    try {
        const result = await pool.query(
            'UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING *',
            [payment_status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Status pembayaran berhasil diperbarui!', data: result.rows[0] });
    } catch (err) {
        console.error('Error Update Payment Status:', err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status pembayaran.' });
    }
});

// DELETE Order Log (Admin Only)
app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Log pesanan berhasil dihapus!' });
    } catch (err) {
        console.error('Error Delete Order:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus log pesanan.' });
    }
});

/* ==========================================================================
   ROUTES: REVIEWS & UGC (PRODUCT REVIEWS & RATINGS)
   ========================================================================== */

// GET Reviews for a Product (Public)
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = req.params.id;
        const reviewsResult = await pool.query(
            'SELECT * FROM product_reviews WHERE product_id = $1 ORDER BY id DESC',
            [productId]
        );

        const ratingResult = await pool.query(
            `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews 
             FROM product_reviews WHERE product_id = $1`,
            [productId]
        );

        res.json({
            success: true,
            summary: {
                avg_rating: parseFloat(ratingResult.rows[0].avg_rating).toFixed(1),
                total_reviews: parseInt(ratingResult.rows[0].total_reviews)
            },
            data: reviewsResult.rows
        });
    } catch (err) {
        console.error('Error Get Product Reviews:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil ulasan produk.' });
    }
});

// POST Create Review (Public / Customer)
app.post('/api/reviews', upload.single('photo'), async (req, res) => {
    try {
        const { product_id, customer_name, rating, comment, order_code } = req.body;
        if (!product_id || !customer_name || !rating) {
            return res.status(400).json({ success: false, message: 'Produk, nama pemesan, dan rating bintang wajib diisi!' });
        }

        let photoUrl = null;
        if (req.file) {
            photoUrl = await processAndSaveImage(req.file.buffer, 'reviews');
        }

        const query = `
            INSERT INTO product_reviews (product_id, order_code, customer_name, rating, comment, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [
            parseInt(product_id), order_code || null, customer_name, 
            parseInt(rating), comment || '', photoUrl
        ];

        const result = await pool.query(query, values);
        res.status(201).json({
            success: true,
            message: 'Terima kasih! Ulasan Anda berhasil ditambahkan.',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error Create Review:', err);
        res.status(500).json({ success: false, message: 'Gagal mengirimkan ulasan.' });
    }
});

// GET All Reviews (Admin Only)
app.get('/api/admin/reviews', authenticateAdmin, async (req, res) => {
    try {
        const query = `
            SELECT r.*, p.name as product_name 
            FROM product_reviews r 
            LEFT JOIN products p ON r.product_id = p.id 
            ORDER BY r.id DESC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error Get Admin Reviews:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar ulasan.' });
    }
});

// DELETE Review (Admin Only)
app.delete('/api/admin/reviews/:id', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM product_reviews WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ulasan tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Ulasan berhasil dihapus!' });
    } catch (err) {
        console.error('Error Delete Review:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus ulasan.' });
    }
});

/* ==========================================================================
   ROUTES: FINANCIAL ANALYTICS & BUSINESS REPORTS (ADMIN ONLY)
   ========================================================================== */

app.get('/api/admin/reports', authenticateAdmin, async (req, res) => {
    try {
        // Gross revenue & paid revenue
        const revenueQuery = `
            SELECT 
                COALESCE(SUM(total_price), 0) as gross_sales,
                COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN total_price ELSE 0 END), 0) as paid_sales,
                COUNT(*) as total_orders,
                COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_orders_count
            FROM orders WHERE status != 'Batal'
        `;
        const revenueRes = await pool.query(revenueQuery);

        // HPP / Cost estimation based on active products
        const hppQuery = `
            SELECT 
                COALESCE(SUM(cost_price), 0) as total_products_hpp,
                COUNT(*) as total_active_products,
                COUNT(CASE WHEN stock_quantity < 5 THEN 1 END) as low_stock_count
            FROM products WHERE is_active = true
        `;
        const hppRes = await pool.query(hppQuery);

        // Low stock products list
        const lowStockRes = await pool.query(
            'SELECT id, name, stock_quantity, price, cost_price, badge FROM products WHERE stock_quantity < 5 AND is_active = true ORDER BY stock_quantity ASC'
        );

        const grossSales = parseInt(revenueRes.rows[0].gross_sales);
        const paidSales = parseInt(revenueRes.rows[0].paid_sales);
        // Net profit estimate (gross sales - estimated 55% HPP/overhead)
        const estimatedHpp = Math.round(grossSales * 0.55);
        const estimatedNetProfit = grossSales - estimatedHpp;

        res.json({
            success: true,
            summary: {
                gross_sales: grossSales,
                paid_sales: paidSales,
                total_orders: parseInt(revenueRes.rows[0].total_orders),
                paid_orders_count: parseInt(revenueRes.rows[0].paid_orders_count),
                estimated_hpp: estimatedHpp,
                estimated_net_profit: estimatedNetProfit,
                low_stock_count: parseInt(hppRes.rows[0].low_stock_count)
            },
            low_stock_products: lowStockRes.rows
        });
    } catch (err) {
        console.error('Error Get Financial Reports:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil laporan keuangan.' });
    }
});

/* ==========================================================================
   ROUTES: STORE SETTINGS (PUBLIC & ADMIN)
   ========================================================================== */

// GET Store Settings (Public)
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM store_settings');
        const settings = {};
        result.rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error Get Settings:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil pengatran toko.' });
    }
});

// PUT Update Store Settings (Admin Only)
app.put('/api/settings', authenticateAdmin, async (req, res) => {
    const { qris_merchant_name, bank_account_info, whatsapp_number, qris_image } = req.body;
    try {
        const settingsToUpdate = { qris_merchant_name, bank_account_info, whatsapp_number, qris_image };
        for (const [key, value] of Object.entries(settingsToUpdate)) {
            if (value !== undefined) {
                await pool.query(
                    `INSERT INTO store_settings (setting_key, setting_value, updated_at) 
                     VALUES ($1, $2, CURRENT_TIMESTAMP)
                     ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
                    [key, value]
                );
            }
        }
        res.json({ success: true, message: 'Pengaturan toko berhasil disimpan!' });
    } catch (err) {
        console.error('Error Update Settings:', err);
        res.status(500).json({ success: false, message: 'Gagal menginstal pengaturan toko.' });
    }
});

// Fallback Route to Serve index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'API Endpoint tidak ditemukan.' });
    }
});

const { runMigrations } = require('./scripts/migrate');

// Start Server with Auto-Migration
(async () => {
    try {
        await runMigrations({ silent: false });
    } catch (err) {
        console.error('⚠️ [MIGRATE] Peringatan: Gagal menjalankan migrasi otomatis saat startup:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Backend Server Dzakirah Bouquet berjalan di http://localhost:${PORT}`);
    });
})();

