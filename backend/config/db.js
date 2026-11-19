
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mockDb = require('./mockDb');

let mockActive = !process.env.DB_HOST;

let pool = null;
if (!mockActive) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'govservice_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });
  } catch (err) {
    console.warn('[GovService-BD] MySQL pool init failed — in-memory fallback active:', err.message);
    mockActive = true;
  }
} else {
  console.warn('[GovService-BD] DB_HOST not configured — using in-memory MySQL fallback.');
}

const db = {
  isMockMode: () => mockActive,
  query: async (sql, params = []) => {
    if (mockActive || !pool) {
      return mockDb.query(sql, params);
    }
    try {
      return await pool.query(sql, params);
    } catch (err) {
      const code = err?.code || err?.errors?.[0]?.code;
      if (
        code === 'ECONNREFUSED' ||
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNRESET'
      ) {
        console.warn('[GovService-BD] MySQL query failed, switching to fallback:', err.message || code);
        mockActive = true;
        return mockDb.query(sql, params);
      }
      throw err;
    }
  },
  getConnection: async () => {
    if (mockActive || !pool) {
      throw new Error('MySQL not configured (in-memory fallback active)');
    }
    try {
      return await pool.getConnection();
    } catch (err) {
      mockActive = true;
      throw err;
    }
  },
};

module.exports = db;
