
const mysql = require('mysql2/promise');
const loadEnv = require('./loadEnv');
loadEnv();
const mockDb = require('./mockDb');

const dbHost = String(process.env.DB_HOST || '').trim();
const dbUser = String(process.env.DB_USER || 'root').trim();
const dbPassword = process.env.DB_PASSWORD ?? '';
const dbName = String(process.env.DB_NAME || 'govservice_db').trim();
const dbPort = Number(process.env.DB_PORT) || 3306;

let mockActive = !dbHost;

let pool = null;
if (!mockActive) {
  try {
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
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
        console.log('[GovService-BD] MySQL server unreachable — using in-memory fallback.');
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
  withTransaction: async (fn) => {
    if (mockActive || !pool) {
      return mockDb.withTransaction(fn);
    }

    let connection;
    try {
      connection = await pool.getConnection();
    } catch (err) {
      const code = err?.code || err?.errors?.[0]?.code;
      if (
        code === 'ECONNREFUSED' ||
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNRESET'
      ) {
        console.log('[GovService-BD] MySQL server unreachable — using in-memory fallback.');
        mockActive = true;
        return mockDb.withTransaction(fn);
      }
      throw err;
    }

    try {
      await connection.beginTransaction();
      const result = await fn(connection);
      await connection.commit();
      return result;
    } catch (err) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback errors on closed connections
      }
      throw err;
    } finally {
      connection.release();
    }
  },
};

module.exports = db;
