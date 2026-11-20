const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');

const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

let personalDocColumnsCache = null;
async function getPersonalDocColumns() {
  if (db.isMockMode()) {
    return new Set(['file_size', 'mime_type']);
  }
  if (personalDocColumnsCache) {
    return personalDocColumnsCache;
  }
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM personal_documents');
    const colSet = new Set(cols.map((c) => String(c.Field || '').toLowerCase()));
    personalDocColumnsCache = colSet;
    return colSet;
  } catch {
    return null;
  }
}

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

    const cols = await getPersonalDocColumns();
    const insertExtended = !cols || (cols.has('file_size') && cols.has('mime_type'));

    let result;
    if (insertExtended) {
      try {
        [result] = await db.query(
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
      } catch (insertErr) {
        if (insertErr && insertErr.code === 'ER_BAD_FIELD_ERROR') {
          personalDocColumnsCache = null;
          [result] = await db.query(
            `INSERT INTO personal_documents
            (user_id, document_name, document_type, file_name, file_path)
            VALUES (?, ?, ?, ?, ?)`,
            [
              req.user.id,
              document_name,
              document_type || null,
              req.file.filename,
              `uploads/${req.file.filename}`,
            ]
          );
        } else {
          throw insertErr;
        }
      }
    } else {
      [result] = await db.query(
        `INSERT INTO personal_documents
        (user_id, document_name, document_type, file_name, file_path)
        VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.id,
          document_name,
          document_type || null,
          req.file.filename,
          `uploads/${req.file.filename}`,
        ]
      );
    }

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
    const [rows] = await db.query(
      `SELECT *
       FROM personal_documents
       WHERE user_id = ?
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    const documents = rows.map((doc) => ({
      id: doc.id,
      document_name: doc.document_name,
      document_type: doc.document_type ?? null,
      file_name: doc.file_name,
      file_path: doc.file_path,
      file_size: doc.file_size ?? null,
      mime_type: doc.mime_type || MIME_BY_EXT[path.extname(doc.file_name || '').toLowerCase()] || null,
      uploaded_at: doc.uploaded_at ?? null,
    }));

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
      `SELECT *
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
    const resolvedMime = doc.mime_type || MIME_BY_EXT[ext.toLowerCase()] || '';

    if (req.query.inline === '1') {
      if (resolvedMime) {
        res.setHeader('Content-Type', resolvedMime);
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
