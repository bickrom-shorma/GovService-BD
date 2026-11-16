
const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

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

    res.status(200).json({
      message: 'Profile retrieved successfully!',
      user: users[0]
    });

  } catch (error) {
    console.error('Profile error:', error.message);

    res.status(500).json({
      message: 'Failed to retrieve profile.'
    });
  }
});

module.exports = router;
