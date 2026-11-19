const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let envLoaded = false;

function loadEnv() {
  if (envLoaded) return;
  envLoaded = true;

  const candidatePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  const seen = new Set();
  for (const envPath of candidatePaths) {
    const normalized = path.normalize(envPath);
    if (seen.has(normalized) || !fs.existsSync(normalized)) continue;
    seen.add(normalized);

    try {
      const raw = fs.readFileSync(normalized, 'utf8').replace(/^\uFEFF/, '');
      const parsed = dotenv.parse(raw);
      for (const [key, value] of Object.entries(parsed)) {
        const current = process.env[key];
        if (current === undefined || String(current).trim() === '') {
          process.env[key] = value;
        }
      }
    } catch (err) {
      console.warn(`[GovService-BD] Failed to load env file at ${normalized}:`, err.message);
    }
  }
}

module.exports = loadEnv;
