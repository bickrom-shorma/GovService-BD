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
  if (!raw || typeof raw === 'boolean' || typeof raw === 'number') {
    return { ...emptyAddress };
  }
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ...emptyAddress };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ...emptyAddress };
  }
  return {
    division: String(obj.division || '').trim(),
    district: String(obj.district || '').trim(),
    upazila: String(obj.upazila || '').trim(),
    union: String(obj.union || '').trim(),
    village: String(obj.village || '').trim(),
  };
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

function normalizeOptionalDate(val) {
  if (val === undefined || val === null) return { valid: true, value: null };
  const str = String(val).trim();
  if (!str) return { valid: true, value: null };
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return { valid: false, value: null };
  const dateStr = match[1];
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() + 1 !== m ||
    parsed.getUTCDate() !== d
  ) {
    return { valid: false, value: null };
  }
  return { valid: true, value: dateStr };
}

function trimNullable(val) {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed ? trimmed : null;
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
    const authUserId = Number(req.user?.id);
    if (!Number.isInteger(authUserId) || authUserId <= 0) {
      return res.status(401).json({ message: 'Invalid authenticated user.' });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [authUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const { password_hash: _passwordHash, ...base } = users[0];
    const ext = await fetchExtendedProfile(authUserId);

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

// Update Logged-in User Profile (transactional: updates users when changed, INSERTs or UPDATEs user_profiles)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const authUserId = Number(req.user?.id);
    if (!Number.isInteger(authUserId) || authUserId <= 0) {
      return res.status(401).json({
        message: 'Invalid authenticated user.'
      });
    }

    const fullName = String(req.body.fullName || '').trim();
    const phone = trimNullable(req.body.phone);

    if (!fullName) {
      return res.status(400).json({
        message: 'Full name is required.'
      });
    }

    if (fullName.length > 150) {
      return res.status(400).json({
        message: 'Full name must be 150 characters or fewer.'
      });
    }

    if (phone && phone.length > 30) {
      return res.status(400).json({
        message: 'Mobile number must be 30 characters or fewer.'
      });
    }

    const nidNumber = trimNullable(req.body.nidNumber);
    if (nidNumber && nidNumber.length > 50) {
      return res.status(400).json({
        message: 'NID number must be 50 characters or fewer.'
      });
    }

    const dobCheck = normalizeOptionalDate(req.body.dateOfBirth);
    if (!dobCheck.valid) {
      return res.status(400).json({
        message: 'Invalid date of birth format. Please use YYYY-MM-DD.'
      });
    }
    const dateOfBirth = dobCheck.value;

    const fatherName = trimNullable(req.body.fatherName);
    const motherName = trimNullable(req.body.motherName);
    const gender = trimNullable(req.body.gender);
    const maritalStatus = trimNullable(req.body.maritalStatus);
    const occupation = trimNullable(req.body.occupation);

    if ((fatherName && fatherName.length > 150) || (motherName && motherName.length > 150)) {
      return res.status(400).json({
        message: 'Parent names must be 150 characters or fewer.'
      });
    }
    if ((gender && gender.length > 30) || (maritalStatus && maritalStatus.length > 30)) {
      return res.status(400).json({
        message: 'Gender and marital status must be 30 characters or fewer.'
      });
    }
    if (occupation && occupation.length > 100) {
      return res.status(400).json({
        message: 'Occupation must be 100 characters or fewer.'
      });
    }

    const presentAddressObj = parseAddress(req.body.presentAddress);
    const permanentAddressObj = parseAddress(req.body.permanentAddress);
    const presentAddressJson = JSON.stringify(presentAddressObj);
    const permanentAddressJson = JSON.stringify(permanentAddressObj);

    const saved = await db.withTransaction(async (tx) => {
      const [users] = await tx.query(
        'SELECT * FROM users WHERE id = ?',
        [authUserId]
      );

      if (users.length === 0) {
        const notFound = new Error('User not found.');
        notFound.statusCode = 404;
        throw notFound;
      }

      const existingUser = users[0];
      const currentFullName = String(existingUser.full_name || '').trim();
      const currentPhone = trimNullable(existingUser.phone);

      if (currentFullName !== fullName || currentPhone !== phone) {
        await tx.query(
          'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
          [fullName, phone, authUserId]
        );
      }

      const [existingProfiles] = await tx.query(
        'SELECT id FROM user_profiles WHERE user_id = ?',
        [authUserId]
      );

      let operation;
      if (existingProfiles.length === 0) {
        await tx.query(
          `INSERT INTO user_profiles
           (user_id, nid_number, date_of_birth, father_name, mother_name, gender, marital_status, occupation, present_address, permanent_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            authUserId,
            nidNumber,
            dateOfBirth,
            fatherName,
            motherName,
            gender,
            maritalStatus,
            occupation,
            presentAddressJson,
            permanentAddressJson,
          ]
        );
        operation = 'inserted';
      } else {
        await tx.query(
          `UPDATE user_profiles
           SET nid_number = ?,
               date_of_birth = ?,
               father_name = ?,
               mother_name = ?,
               gender = ?,
               marital_status = ?,
               occupation = ?,
               present_address = ?,
               permanent_address = ?
           WHERE user_id = ?`,
          [
            nidNumber,
            dateOfBirth,
            fatherName,
            motherName,
            gender,
            maritalStatus,
            occupation,
            presentAddressJson,
            permanentAddressJson,
            authUserId,
          ]
        );
        operation = 'updated';
      }

      return { existingUser, operation };
    });

    return res.status(200).json({
      message: 'Profile updated successfully!',
      operation: saved.operation,
      profile: {
        fullName,
        email: saved.existingUser.email || '',
        phone: phone || '',
        role: saved.existingUser.role || 'user',
        nidNumber: nidNumber || '',
        dateOfBirth: dateOfBirth || '',
        fatherName: fatherName || '',
        motherName: motherName || '',
        gender: gender || '',
        maritalStatus: maritalStatus || '',
        occupation: occupation || '',
        presentAddress: presentAddressObj,
        permanentAddress: permanentAddressObj,
      }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'A profile already exists for this account. Please try again.'
      });
    }
    if (
      error.code === 'ER_DATA_TOO_LONG' ||
      error.code === 'ER_TRUNCATED_WRONG_VALUE' ||
      error.code === 'ER_BAD_NULL_ERROR'
    ) {
      return res.status(400).json({
        message: 'One or more profile fields contain invalid or overly long values.'
      });
    }
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'PROTOCOL_CONNECTION_LOST' ||
      error.code === 'ETIMEDOUT'
    ) {
      return res.status(503).json({
        message: 'Database service temporarily unavailable. Please try again.'
      });
    }
    console.error('Update profile error:', error.code || error.message);
    return res.status(500).json({
      message: 'Failed to update profile.'
    });
  }
});

module.exports = router;
