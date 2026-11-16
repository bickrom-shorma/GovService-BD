
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const router = express.Router();

// User Registration API
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    // Check required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: 'Full name, email and password are required.'
      });
    }

    // Check existing email
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'Email already registered.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const [result] = await db.query(
      `INSERT INTO users
      (full_name, email, phone, password_hash)
      VALUES (?, ?, ?, ?)`,
      [full_name, email, phone || null, hashedPassword]
    );

    res.status(201).json({
      message: 'Registration successful!',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Registration error:', error.message);

    res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
});

module.exports = router;
