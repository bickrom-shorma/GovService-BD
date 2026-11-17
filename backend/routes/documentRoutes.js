
const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Upload Personal Document
router.post(
  '/upload',
  verifyToken,
  upload.single('document'),
  async (req, res) => {
    try {
      const { document_name, document_type } = req.body;

      if (!document_name || !req.file) {
        return res.status(400).json({
          message: 'Document name and file are required.'
        });
      }

      const [result] = await db.query(
        `INSERT INTO personal_documents
        (user_id, document_name, document_type, file_name, file_path)
        VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.id,
          document_name,
          document_type || null,
          req.file.filename,
          `uploads/${req.file.filename}`
        ]
      );

      res.status(201).json({
        message: 'Document uploaded successfully!',
        documentId: result.insertId,
        fileName: req.file.filename
      });

    } catch (error) {
      console.error('Document upload error:', error.message);

      res.status(500).json({
        message: 'Document upload failed.'
      });
    }
  }
);
// Get All Personal Documents
router.get('/', verifyToken, async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, document_name, document_type,
              file_name, file_path, uploaded_at
       FROM personal_documents
       WHERE user_id = ?
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      message: 'Documents retrieved successfully!',
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error.message);

    res.status(500).json({
      message: 'Failed to retrieve documents.'
    });
  }
});

module.exports = router;
