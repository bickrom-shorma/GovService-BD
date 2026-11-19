const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

const emptyAddress = {
  division: '',
  district: '',
  upazila: '',
  union: '',
  village: '',
};

function parseAddress(raw) {
  if (!raw) return { ...emptyAddress };
  if (typeof raw === 'object') return { ...emptyAddress, ...raw };
  try {
    return { ...emptyAddress, ...JSON.parse(raw) };
  } catch {
    return { ...emptyAddress };
  }
}

function formatDateOnly(val) {
  if (!val) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str.slice(0, 10);
}

let userProfilesTableReady = false;
async function ensureUserProfilesTable() {
  if (userProfilesTableReady || db.isMockMode()) {
    userProfilesTableReady = true;
    return true;
  }
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        nid_number VARCHAR(50) NULL,
        date_of_birth DATE NULL,
        father_name VARCHAR(150) NULL,
        mother_name VARCHAR(150) NULL,
        gender VARCHAR(30) NULL,
        marital_status VARCHAR(30) NULL,
        occupation VARCHAR(100) NULL,
        present_address JSON NULL,
        permanent_address JSON NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_profiles_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    userProfilesTableReady = true;
    return true;
  } catch (err) {
    console.warn('Could not ensure user_profiles table:', err.message);
    return false;
  }
}

async function fetchExtendedProfile(userId) {
  try {
    const [profiles] = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    return profiles[0] || {};
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      const created = await ensureUserProfilesTable();
      if (created) {
        const [profiles] = await db.query(
          'SELECT * FROM user_profiles WHERE user_id = ?',
          [userId]
        );
        return profiles[0] || {};
      }
      return {};
    }
    throw err;
  }
}

// Get Logged-in User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const { password_hash: _passwordHash, ...base } = users[0];
    const ext = await fetchExtendedProfile(req.user.id);

    return res.status(200).json({
      message: 'Profile retrieved successfully!',
      user: base,
      profile: {
        fullName: base.full_name || '',
        email: base.email || '',
        phone: base.phone || '',
        role: base.role || 'user',
        nidNumber: ext.nid_number || '',
        dateOfBirth: formatDateOnly(ext.date_of_birth),
        fatherName: ext.father_name || '',
        motherName: ext.mother_name || '',
        gender: ext.gender || '',
        maritalStatus: ext.marital_status || '',
        occupation: ext.occupation || '',
        presentAddress: parseAddress(ext.present_address),
        permanentAddress: parseAddress(ext.permanent_address),
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return res.status(500).json({
      message: 'Failed to retrieve profile.'
    });
  }
});

// Update Logged-in User Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!fullName) {
      return res.status(400).json({
        message: 'Full name is required.'
      });
    }

    await db.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [fullName, phone || null, req.user.id]
    );

    const nidNumber = String(req.body.nidNumber || '').trim() || null;
    const dateOfBirth = req.body.dateOfBirth ? String(req.body.dateOfBirth).slice(0, 10) : null;
    const fatherName = String(req.body.fatherName || '').trim() || null;
    const motherName = String(req.body.motherName || '').trim() || null;
    const gender = String(req.body.gender || '').trim() || null;
    const maritalStatus = String(req.body.maritalStatus || '').trim() || null;
    const occupation = String(req.body.occupation || '').trim() || null;
    const presentAddress = JSON.stringify(parseAddress(req.body.presentAddress));
    const permanentAddress = JSON.stringify(parseAddress(req.body.permanentAddress));

    const upsertSql = `INSERT INTO user_profiles
       (user_id, nid_number, date_of_birth, father_name, mother_name, gender, marital_status, occupation, present_address, permanent_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nid_number = VALUES(nid_number),
         date_of_birth = VALUES(date_of_birth),
         father_name = VALUES(father_name),
         mother_name = VALUES(mother_name),
         gender = VALUES(gender),
         marital_status = VALUES(marital_status),
         occupation = VALUES(occupation),
         present_address = VALUES(present_address),
         permanent_address = VALUES(permanent_address)`;
    const upsertParams = [
      req.user.id,
      nidNumber,
      dateOfBirth,
      fatherName,
      motherName,
      gender,
      maritalStatus,
      occupation,
      presentAddress,
      permanentAddress,
    ];

    try {
      await db.query(upsertSql, upsertParams);
    } catch (upsertErr) {
      if (upsertErr && upsertErr.code === 'ER_NO_SUCH_TABLE' && await ensureUserProfilesTable()) {
        await db.query(upsertSql, upsertParams);
      } else {
        throw upsertErr;
      }
    }

    return res.status(200).json({
      message: 'Profile updated successfully!',
      profile: {
        fullName,
        phone,
        nidNumber: nidNumber || '',
        dateOfBirth: dateOfBirth || '',
        fatherName: fatherName || '',
        motherName: motherName || '',
        gender: gender || '',
        maritalStatus: maritalStatus || '',
        occupation: occupation || '',
        presentAddress: parseAddress(req.body.presentAddress),
        permanentAddress: parseAddress(req.body.permanentAddress),
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      message: 'Failed to update profile.'
    });
  }
});

module.exports = router;
