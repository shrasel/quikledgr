import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'quikledgr_user',
  password: process.env.DB_PASSWORD || 'quikledgr_secure_pass_2026',
  database: process.env.DB_NAME || 'quikledgr_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  multipleStatements: true,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Successfully connected to MariaDB: ${process.env.DB_NAME || 'quikledgr_db'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] Database connection error:', error.message);
    return false;
  }
}

export default pool;
