// CLI helper to create or promote an admin user safely
// Usage: node backend/scripts/createAdmin.js <email> <password> [full_name]

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function main() {
  const [, , emailArg, passwordArg, nameArg] = process.argv;
  const email = String(emailArg || '').trim().toLowerCase();
  const password = String(passwordArg || '');
  const fullName = String(nameArg || 'System Administrator').trim();

  if (!email || !password || password.length < 8) {
    console.error('Usage: node backend/scripts/createAdmin.js <email> <password(min 8 chars)> [full_name]');
    process.exit(1);
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    const hashed = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      await db.query('UPDATE users SET role = ?, is_active = 1 WHERE id = ?', ['admin', existing[0].id]);
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, existing[0].id]);
      console.log(`Updated existing user ${email} to admin.`);
    } else {
      await db.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [fullName, email, null, hashed, 'admin']
      );
      console.log(`Created admin user ${email}.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
}

main();
