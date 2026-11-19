const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');

// Wrap Multer to return clean 400 errors on invalid file types or oversized files
const handleDocumentUpload = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || 'Invalid document upload.'
      });
    }
    next();
  });
};

// Upload Personal Document
router.post('/upload', verifyToken, handleDocumentUpload, async (req, res) => {
  try {
    const document_name = String(req.body.document_name || req.file?.originalname || '').trim();
    const document_type = String(req.body.document_type || '').trim();

    if (!document_name || !req.file) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: 'Document name and file are required.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO personal_documents
      (user_id, document_name, document_type, file_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        document_name,
        document_type || null,
        req.file.filename,
        `uploads/${req.file.filename}`,
        req.file.size,
        req.file.mimetype
      ]
    );

    return res.status(201).json({
      message: 'Document uploaded successfully!',
      documentId: result.insertId,
      fileName: req.file.filename,
      document: {
        id: result.insertId,
        document_name,
        document_type: document_type || null,
        file_name: req.file.filename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Document upload error:', error.message);
    return res.status(500).json({
      message: 'Document upload failed.'
    });
  }
});

// Get All Personal Documents for Logged-in User
router.get('/', verifyToken, async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, document_name, document_type,
              file_name, file_path, file_size, mime_type, uploaded_at
       FROM personal_documents
       WHERE user_id = ?
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      message: 'Documents retrieved successfully!',
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error.message);
    return res.status(500).json({
      message: 'Failed to retrieve documents.'
    });
  }
});

// Securely View or Download a Personal Document (Ownership Verified)
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    const [documents] = await db.query(
      `SELECT id, user_id, document_name, file_name, mime_type
       FROM personal_documents
       WHERE id = ? AND user_id = ?`,
      [documentId, req.user.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        message: 'Document not found.'
      });
    }

    const doc = documents[0];
    const safeFileName = path.basename(doc.file_name);
    const filePath = path.join(uploadDir, safeFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'Document file is missing from storage.'
      });
    }

    const ext = path.extname(safeFileName);
    const downloadName = doc.document_name.endsWith(ext)
      ? doc.document_name
      : `${doc.document_name}${ext}`;

    if (req.query.inline === '1') {
      if (doc.mime_type) {
        res.setHeader('Content-Type', doc.mime_type);
      }
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(downloadName)}"`);
      return res.sendFile(filePath);
    }

    return res.download(filePath, downloadName);
  } catch (error) {
    console.error('Document download error:', error.message);
    return res.status(500).json({
      message: 'Failed to access document.'
    });
  }
});

// Delete Personal Document
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const documentId = req.params.id;

    const [documents] = await db.query(
      `SELECT id, file_name
       FROM personal_documents
       WHERE id = ? AND user_id = ?`,
      [documentId, req.user.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        message: 'Document not found.'
      });
    }

    const safeFileName = path.basename(documents[0].file_name);
    const filePath = path.join(uploadDir, safeFileName);

    await db.query(
      `DELETE FROM personal_documents
       WHERE id = ? AND user_id = ?`,
      [documentId, req.user.id]
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      message: 'Document deleted successfully!'
    });
  } catch (error) {
    console.error('Document delete error:', error.message);
    return res.status(500).json({
      message: 'Document deletion failed.'
    });
  }
});

module.exports = router;
