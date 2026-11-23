const path = require('path');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const loadEnv = require('./config/loadEnv');
loadEnv();

const db = require('./config/db');
const { ensureManagedServicesTable } = require('./config/schemaEnsure');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const savedServiceRoutes = require('./routes/savedServiceRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const aiRoutes = require('./routes/aiRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/saved-services', savedServiceRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    databaseMode: db.isMockMode() ? 'in-memory-fallback' : 'mysql',
    message: 'GovService-BD Backend Server is Running!'
  });
});

// Return clean 404 JSON for unmatched /api/* routes instead of SPA index.html
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

const fs = require('fs');
const { spawn } = require('child_process');

// Serve built frontend static files
const frontendRootPath = path.join(__dirname, '../frontend');
const frontendDistPath = path.join(frontendRootPath, 'dist');
const frontendIndexHtml = path.join(frontendDistPath, 'index.html');

function getBuiltAssetsCount() {
  const assetsDir = path.join(frontendDistPath, 'assets');
  if (!fs.existsSync(assetsDir)) return 0;
  try {
    return fs.readdirSync(assetsDir).length;
  } catch {
    return 0;
  }
}

function needsFrontendBuild() {
  if (process.env.FORCE_FRONTEND_BUILD === 'true') return true;
  if (!fs.existsSync(frontendIndexHtml)) return true;
  return getBuiltAssetsCount() === 0;
}

function resolveViteScript() {
  const candidates = [
    path.join(frontendRootPath, 'node_modules', 'vite', 'bin', 'vite.js'),
    path.join(__dirname, '../node_modules', 'vite', 'bin', 'vite.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

let buildPromise = null;
function ensureFrontendBuilt() {
  if (buildPromise) return buildPromise;
  if (!needsFrontendBuild()) return Promise.resolve();

  buildPromise = new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const viteScript = resolveViteScript();
    let child;

    try {
      if (viteScript) {
        child = spawn(process.execPath, [viteScript, 'build'], {
          cwd: frontendRootPath,
          stdio: 'inherit',
          windowsHide: true,
        });
      } else {
        child = spawn('npm run build', {
          cwd: frontendRootPath,
          stdio: 'inherit',
          shell: isWin ? true : '/bin/sh',
          windowsHide: true,
        });
      }
    } catch (err) {
      console.error('[GovService-BD] Failed to spawn frontend build:', err.message);
      buildPromise = null;
      resolve();
      return;
    }

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`[GovService-BD] Frontend build exited with code ${code}`);
      }
      buildPromise = null;
      resolve();
    });

    child.on('error', (err) => {
      console.error('[GovService-BD] Failed to start frontend build:', err.message);
      buildPromise = null;
      resolve();
    });
  });

  return buildPromise;
}

app.use((req, res, next) => {
  if (buildPromise) {
    return buildPromise.then(() => next()).catch(() => next());
  }
  return next();
});

app.use(express.static(frontendDistPath));

// Serve favicon cleanly if requested at /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(frontendDistPath, 'favicon.svg'));
});

// SPA fallback for React Router (Express 5 wildcard syntax)
app.get('/{*splat}', (req, res) => {
  if (!fs.existsSync(frontendIndexHtml)) {
    return res.status(503).send('Frontend build is still initializing. Please refresh.');
  }
  return res.sendFile(frontendIndexHtml);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[GovService-BD] Server error:', err.message);
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  return res.status(500).json({ message: err.message || 'Internal server error' });
});

async function bootstrapAdminFromEnv() {
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
  if (!email || !password || password.length < 8) return;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length === 0) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['System Administrator', email, null, hashed, 'admin']
      );
      console.log(`[GovService-BD] Bootstrapped admin account for ${email}`);
    }
  } catch (err) {
    console.warn('[GovService-BD] Admin bootstrap skipped:', err.message);
  }
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  ensureFrontendBuilt();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });

  try {
    const connection = await db.getConnection();
    console.log('MySQL Database Connected Successfully!');
    connection.release();
    await ensureManagedServicesTable();
  } catch (error) {
    const errCode = error?.code || error?.errors?.[0]?.code;
    if (
      !process.env.DB_HOST ||
      errCode === 'ECONNREFUSED' ||
      errCode === 'ENOTFOUND' ||
      errCode === 'ETIMEDOUT' ||
      errCode === 'EHOSTUNREACH'
    ) {
      console.log('[GovService-BD] MySQL server not reachable — running with in-memory fallback.');
    } else {
      console.warn('Database connection failed — running with in-memory fallback:', error.message || errCode);
    }
  }

  await bootstrapAdminFromEnv();
}

if (require.main === module) {
  startServer();
}

module.exports = app;
