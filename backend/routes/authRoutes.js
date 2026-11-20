const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { getJwtSecret } = require('../utils/jwtSecret');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// User Registration API
router.post('/register', async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: 'Full name, email and password are required.'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long.'
      });
    }

    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'Email already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
      (full_name, email, phone, password_hash)
      VALUES (?, ?, ?, ?)`,
      [full_name, email, phone || null, hashedPassword]
    );

    const user = {
      id: result.insertId,
      full_name,
      email,
      phone: phone || null,
      role: 'user'
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      message: 'Registration successful!',
      userId: result.insertId,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
});

// User Login API
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (user.is_active === 0) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      message: 'Login failed. Please try again.'
    });
  }
});

// Get Current Logged-in User
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { password_hash: _passwordHash, ...safeUser } = users[0];

    if (safeUser.is_active === 0) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    return res.status(200).json({
      user: {
        id: safeUser.id,
        full_name: safeUser.full_name,
        email: safeUser.email,
        phone: safeUser.phone ?? null,
        role: safeUser.role || 'user',
        is_active: safeUser.is_active ?? 1,
        created_at: safeUser.created_at ?? null,
      }
    });
  } catch (error) {
    console.error('Get current user error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve current user.' });
  }
});

// Change Password API
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'All password fields are required.'
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirm password do not match.'
      });
    }

    const [users] = await db.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'New password must be different from current password.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    return res.status(200).json({
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({
      message: 'Password change failed. Please try again.'
    });
  }
});

module.exports = router;
