
const express = require('express'); const jwt = require('jsonwebtoken');
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


// User Login API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    // Find user by email
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
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

    res.status(500).json({
      message: 'Login failed. Please try again.'
    });
  }
});

// Change Password API
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'All password fields are required.'
      });
    }

    // Check new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long.'
      });
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirm password do not match.'
      });
    }

    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication token is required.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find logged-in user
    const [users] = await db.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect.'
      });
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'New password must be different from current password.'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, decoded.id]
    );

    return res.status(200).json({
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('Change password error:', error.message);

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        message: 'Invalid or expired authentication token.'
      });
    }

    return res.status(500).json({
      message: 'Password change failed. Please try again.'
    });
  }
});



module.exports = router;
