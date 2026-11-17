
const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// GET: Retrieve user's document checklist
router.get('/', verifyToken, async (req, res) => {
  try {
    const { service_key } = req.query;

    let sql = `
      SELECT * FROM document_checklists
      WHERE user_id = ?
    `;
    const values = [req.user.id];

    if (service_key) {
      sql += ' AND service_key = ?';
      values.push(service_key);
    }

    sql += ' ORDER BY created_at DESC';

    const [checklists] = await db.query(sql, values);

    res.status(200).json({
      message: 'Document checklist retrieved successfully!',
      checklists
    });

  } catch (error) {
    console.error('Get checklist error:', error.message);
    res.status(500).json({
      message: 'Server error while retrieving checklist.'
    });
  }
});

// POST: Add a document to checklist
router.post('/', verifyToken, async (req, res) => {
  try {
    const { service_key, document_name } = req.body;

    if (!service_key || !document_name) {
      return res.status(400).json({
        message: 'Service key and document name are required.'
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM document_checklists
       WHERE user_id = ? AND service_key = ? AND document_name = ?`,
      [req.user.id, service_key, document_name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'This document is already in the checklist.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO document_checklists
       (user_id, service_key, document_name)
       VALUES (?, ?, ?)`,
      [req.user.id, service_key, document_name]
    );

    res.status(201).json({
      message: 'Document added to checklist successfully!',
      checklistId: result.insertId
    });

  } catch (error) {
    console.error('Add checklist error:', error.message);
    res.status(500).json({
      message: 'Server error while adding document.'
    });
  }
});

// PATCH: Update document completion status
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    if (
      typeof is_completed !== 'boolean' &&
      is_completed !== 0 &&
      is_completed !== 1
    ) {
      return res.status(400).json({
        message: 'A valid completion status is required.'
      });
    }

    const [result] = await db.query(
      `UPDATE document_checklists
       SET is_completed = ?
       WHERE id = ? AND user_id = ?`,
      [is_completed ? 1 : 0, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Checklist item not found.'
      });
    }

    res.status(200).json({
      message: 'Checklist status updated successfully!'
    });

  } catch (error) {
    console.error('Update checklist error:', error.message);
    res.status(500).json({
      message: 'Server error while updating checklist.'
    });
  }
});

// DELETE: Remove a checklist item
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM document_checklists
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Checklist item not found.'
      });
    }

    res.status(200).json({
      message: 'Checklist item deleted successfully!'
    });

  } catch (error) {
    console.error('Delete checklist error:', error.message);
    res.status(500).json({
      message: 'Server error while deleting checklist item.'
    });
  }
});

module.exports = router;
