import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'quikledgr_user',
  password: process.env.DB_PASSWORD || 'quikledgr_secure_pass_2026',
  database: process.env.DB_NAME || 'quikledgr_db',
  multipleStatements: true,
};

async function waitForDatabase(retries = 15, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      // Connect without selecting database to verify MariaDB socket/network is alive
      const conn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
      });
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
      await conn.end();
      return true;
    } catch (err) {
      console.log(`[DB Migration] Waiting for MariaDB (${i}/${retries})... (${err.message})`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export async function runMigrations() {
  console.log('[DB Migration] Starting migration check...');

  await waitForDatabase();

  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Create migration tracking table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Fetch already executed migrations
    const [rows] = await connection.query('SELECT migration_name FROM schema_migrations;');
    const executedMigrations = new Set(rows.map((r) => r.migration_name));

    // 3. Find and sort all .sql migration files
    const files = fs.readdirSync(__dirname)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`[DB Migration] Applying migration: ${file}...`);
        const filePath = path.join(__dirname, file);
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Execute statements
        await connection.query(sqlContent);

        // Record execution
        await connection.query(
          'INSERT INTO schema_migrations (migration_name) VALUES (?);',
          [file]
        );
        console.log(`[DB Migration] ✅ Successfully applied: ${file}`);
      } else {
        console.log(`[DB Migration] Already applied: ${file}`);
      }
    }

    console.log('[DB Migration] All database migrations are up to date.');
  } catch (error) {
    console.error('[DB Migration] ❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Execute directly if run as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}
