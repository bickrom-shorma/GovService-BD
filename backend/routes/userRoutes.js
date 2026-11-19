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

// Get Logged-in User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role, created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const [profiles] = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );

    const base = users[0];
    const ext = profiles[0] || {};

    return res.status(200).json({
      message: 'Profile retrieved successfully!',
      user: base,
      profile: {
        fullName: base.full_name || '',
        email: base.email || '',
        phone: base.phone || '',
        role: base.role || 'user',
        nidNumber: ext.nid_number || '',
        dateOfBirth: ext.date_of_birth
          ? String(ext.date_of_birth).slice(0, 10)
          : '',
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

    await db.query(
      `INSERT INTO user_profiles
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
         permanent_address = VALUES(permanent_address)`,
      [
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
      ]
    );

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
