const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: 'attend-db',
  user: 'root',
  password: 'rootpass',
  database: 'class_attendance_db',
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
