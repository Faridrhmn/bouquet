const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

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

if (typeof process.env.PGPASSWORD === 'string' && process.env.PGPASSWORD !== '') {
    poolConfig.password = process.env.PGPASSWORD;
} else if (process.env.PGPASSWORD === '') {
    poolConfig.password = '';
}

if (process.env.PGPORT) {
    poolConfig.port = parseInt(process.env.PGPORT, 10);
}

const pool = new Pool(poolConfig);
const migrationsDir = path.join(__dirname, '..', 'migrations');

/**
 * Ensure schema_migrations table exists
 */
async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

/**
 * Get all migration files from migrations/ folder sorted
 */
function getMigrationFiles() {
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }
    return fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
}

/**
 * Run pending migrations
 */
async function runMigrations({ silent = false } = {}) {
    const client = await pool.connect();
    try {
        await ensureMigrationsTable(client);

        const { rows } = await client.query('SELECT name FROM schema_migrations');
        const executedMigrations = new Set(rows.map(r => r.name));

        const files = getMigrationFiles();
        const pendingFiles = files.filter(file => !executedMigrations.has(file));

        if (pendingFiles.length === 0) {
            if (!silent) console.log('📦 [MIGRATE] Database sudah up-to-date. Tidak ada migrasi pending.');
            return { applied: 0 };
        }

        if (!silent) console.log(`🚀 [MIGRATE] Menjalankan ${pendingFiles.length} migrasi pending...`);

        for (const file of pendingFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                if (!silent) console.log(`  ✅ [MIGRATE] Berhasil: ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`  ❌ [MIGRATE] Gagal saat menjalankan ${file}:`, err.message);
                throw err;
            }
        }

        if (!silent) console.log('🎉 [MIGRATE] Semua migrasi berhasil diterapkan!');
        return { applied: pendingFiles.length };
    } finally {
        client.release();
    }
}

/**
 * Display migration status
 */
async function getMigrationStatus() {
    const client = await pool.connect();
    try {
        await ensureMigrationsTable(client);

        const { rows } = await client.query('SELECT name, executed_at FROM schema_migrations ORDER BY id ASC');
        const executedMap = new Map(rows.map(r => [r.name, r.executed_at]));

        const files = getMigrationFiles();
        console.log('\n📊 STATUS MIGRASI DATABASE');
        console.log('---------------------------------------------------------');
        console.log(String('Nama File').padEnd(40) + 'Status / Waktu Eksekusi');
        console.log('---------------------------------------------------------');

        if (files.length === 0) {
            console.log('Belum ada file migrasi di direktori migrations/');
        }

        for (const file of files) {
            if (executedMap.has(file)) {
                const executedAt = new Date(executedMap.get(file)).toLocaleString('id-ID');
                console.log(`✅ ${file.padEnd(38)} Diterapkan (${executedAt})`);
            } else {
                console.log(`⏳ ${file.padEnd(38)} PENDING`);
            }
        }
        console.log('---------------------------------------------------------\n');
    } finally {
        client.release();
    }
}

/**
 * Helper to create a new migration template file
 */
function createMigration(name) {
    if (!name) {
        console.error('❌ Harap tentukan nama migrasi! Contoh: npm run db:migrate:create add_orders_notes');
        process.exit(1);
    }
    const timestamp = new Date().toISOString().replace(/[-T:\..Z]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const fileName = `${timestamp}_${cleanName}.sql`;
    const filePath = path.join(migrationsDir, fileName);

    const template = `-- Migration: ${name}
-- Dibuat pada: ${new Date().toISOString()}

-- Tulis kueri DDL SQL Anda di bawah ini:
-- Contoh:
-- CREATE TABLE IF NOT EXISTS example (id SERIAL PRIMARY KEY, name VARCHAR(100));
`;

    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✨ File migrasi baru berhasil dibuat: migrations/${fileName}`);
}

// Command Line Interface Execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'up';

    (async () => {
        try {
            if (command === 'up') {
                await runMigrations();
            } else if (command === 'status') {
                await getMigrationStatus();
            } else if (command === 'create') {
                createMigration(args[1]);
            } else {
                console.log(`Perintah tidak dikenal: ${command}. Gunakan 'up', 'status', atau 'create <nama>'.`);
            }
        } catch (err) {
            console.error('❌ Terjadi kesalahan saat migrasi:', err.message);
            process.exit(1);
        } finally {
            await pool.end();
        }
    })();
}

module.exports = {
    runMigrations,
    getMigrationStatus,
    createMigration
};
