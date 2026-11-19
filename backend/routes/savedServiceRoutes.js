const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Add a Saved Service
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      service_key,
      category_id,
      service_index,
      service_name,
      category_name
    } = req.body;

    if (!service_key || !service_name) {
      return res.status(400).json({
        message: 'Service key and service name are required.'
      });
    }

    const [existing] = await db.query(
      'SELECT id FROM saved_services WHERE user_id = ? AND service_key = ?',
      [req.user.id, service_key]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'This service is already saved.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO saved_services
      (user_id, service_key, category_id, service_index, service_name, category_name)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        service_key,
        category_id || null,
        service_index ?? null,
        service_name,
        category_name || null
      ]
    );

    return res.status(201).json({
      message: 'Service saved successfully!',
      savedServiceId: result.insertId
    });
  } catch (error) {
    console.error('Save service error:', error.message);
    return res.status(500).json({
      message: 'Server error while saving service.'
    });
  }
});

// Get Logged-in User's Saved Services
router.get('/', verifyToken, async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM saved_services WHERE user_id = ? ORDER BY saved_at DESC',
      [req.user.id]
    );

    return res.status(200).json({
      services
    });
  } catch (error) {
    console.error('Get saved services error:', error.message);
    return res.status(500).json({
      message: 'Server error while fetching saved services.'
    });
  }
});

// Remove a Saved Service by service_key
router.delete('/by-key/:serviceKey', verifyToken, async (req, res) => {
  try {
    const { serviceKey } = req.params;

    const [result] = await db.query(
      'DELETE FROM saved_services WHERE service_key = ? AND user_id = ?',
      [serviceKey, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Saved service not found.'
      });
    }

    return res.status(200).json({
      message: 'Saved service removed successfully!'
    });
  } catch (error) {
    console.error('Remove saved service by key error:', error.message);
    return res.status(500).json({
      message: 'Server error while removing saved service.'
    });
  }
});

// Remove a Saved Service by ID
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM saved_services WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Saved service not found.'
      });
    }

    return res.status(200).json({
      message: 'Saved service removed successfully!'
    });
  } catch (error) {
    console.error('Remove saved service error:', error.message);
    return res.status(500).json({
      message: 'Server error while removing saved service.'
    });
  }
});

module.exports = router;
