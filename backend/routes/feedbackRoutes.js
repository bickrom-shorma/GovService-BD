
const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// POST: Submit Feedback or Report
router.post('/', verifyToken, async (req, res) => {
  try {
    const { feedback_type, subject, message } = req.body;

    if (!feedback_type || !subject || !message) {
      return res.status(400).json({
        message: 'Feedback type, subject and message are required.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO feedback_reports
       (user_id, feedback_type, subject, message)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, feedback_type, subject, message]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      feedbackId: result.insertId
    });

  } catch (error) {
    console.error('Submit feedback error:', error.message);
    res.status(500).json({
      message: 'Server error while submitting feedback.'
    });
  }
});

// GET: Retrieve user's Feedback and Reports
router.get('/', verifyToken, async (req, res) => {
  try {
    const [feedbacks] = await db.query(
      `SELECT * FROM feedback_reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      message: 'Feedback and reports retrieved successfully!',
      feedbacks
    });

  } catch (error) {
    console.error('Get feedback error:', error.message);
    res.status(500).json({
      message: 'Server error while retrieving feedback.'
    });
  }
});

// DELETE: Remove user's Feedback or Report
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM feedback_reports
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Feedback or report not found.'
      });
    }

    res.status(200).json({
      message: 'Feedback or report deleted successfully!'
    });

  } catch (error) {
    console.error('Delete feedback error:', error.message);
    res.status(500).json({
      message: 'Server error while deleting feedback.'
    });
  }
});

module.exports = router;
