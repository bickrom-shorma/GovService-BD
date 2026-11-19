const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

let runtimeSecret = process.env.JWT_SECRET || '';
const SECRET_FILE = path.join(os.tmpdir(), 'govservice-bd-jwt.secret');

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (runtimeSecret) {
    return runtimeSecret;
  }

  if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_JWT_SECRET === 'true') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  }

  try {
    if (fs.existsSync(SECRET_FILE)) {
      const stored = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (stored.length >= 32) {
        runtimeSecret = stored;
        return runtimeSecret;
      }
    }
  } catch {
    // Ignore read error and generate new runtime secret
  }

  runtimeSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, runtimeSecret, { mode: 0o600 });
  } catch {
    // Ignore write error in read-only filesystems
  }
  console.warn('[GovService-BD] JWT_SECRET is not set — using persisted runtime secret.');
  return runtimeSecret;
}

module.exports = { getJwtSecret };
