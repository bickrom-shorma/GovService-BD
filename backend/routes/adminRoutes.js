const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { ensureManagedServicesTable } = require('../config/schemaEnsure');
const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');

// All admin routes require authentication + admin role
router.use(verifyToken, requireAdmin);

// GET: Admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    if (db.isMockMode()) {
      const [rows] = await db.query(
        `SELECT
          (SELECT COUNT(*) FROM users) AS totalUsers,
          (SELECT COUNT(*) FROM personal_documents) AS totalDocuments,
          (SELECT COUNT(*) FROM saved_services) AS totalSavedServices,
          (SELECT COUNT(*) FROM feedback_reports) AS totalFeedback,
          (SELECT COUNT(*) FROM feedback_reports WHERE status = 'pending') AS pendingFeedback,
          (SELECT COUNT(*) FROM managed_services) AS totalManagedServices`
      );
      return res.status(200).json({ stats: rows[0] });
    }

    await ensureManagedServicesTable();

    const safeCount = async (sql, fallback = 0) => {
      try {
        const [r] = await db.query(sql);
        return Number(r?.[0]?.cnt ?? 0);
      } catch {
        return fallback;
      }
    };

    const [
      totalUsers,
      totalDocuments,
      totalSavedServices,
      totalFeedback,
      pendingFeedback,
      totalManagedServices,
    ] = await Promise.all([
      safeCount('SELECT COUNT(*) AS cnt FROM users'),
      safeCount('SELECT COUNT(*) AS cnt FROM personal_documents'),
      safeCount('SELECT COUNT(*) AS cnt FROM saved_services'),
      safeCount('SELECT COUNT(*) AS cnt FROM feedback_reports'),
      safeCount("SELECT COUNT(*) AS cnt FROM feedback_reports WHERE status = 'pending'"),
      safeCount('SELECT COUNT(*) AS cnt FROM managed_services'),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalDocuments,
        totalSavedServices,
        totalFeedback,
        pendingFeedback,
        totalManagedServices,
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve admin statistics.' });
  }
});

// GET: List all users (never return password_hash)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    const users = rows.map(({ password_hash: _passwordHash, ...u }) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone ?? null,
      role: u.role || 'user',
      is_active: u.is_active ?? 1,
      created_at: u.created_at ?? null,
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Admin list users error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// PATCH: Update user role or active status
router.patch('/users/:id', async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role, is_active } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "user" or "admin".' });
    }

    if (targetId === req.user.id && (role !== 'admin' || Number(is_active) === 0)) {
      return res.status(400).json({
        message: 'You cannot demote or deactivate your own administrator account.'
      });
    }

    const activeFlag = is_active === undefined ? 1 : Number(Boolean(is_active));

    let result;
    try {
      [result] = await db.query(
        'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
        [role, activeFlag, targetId]
      );
    } catch (updateErr) {
      if (updateErr && updateErr.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await db.query(
          'UPDATE users SET role = ? WHERE id = ?',
          [role, targetId]
        );
      } else {
        throw updateErr;
      }
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ message: 'User updated successfully!' });
  } catch (error) {
    console.error('Admin update user error:', error.message);
    return res.status(500).json({ message: 'Failed to update user.' });
  }
});

// GET: List all feedback reports
router.get('/feedback', async (req, res) => {
  try {
    const [feedbacks] = await db.query(
      `SELECT f.*, u.full_name AS user_name, u.email AS user_email
       FROM feedback_reports f
       JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC`
    );

    return res.status(200).json({ feedbacks });
  } catch (error) {
    console.error('Admin list feedback error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve feedback.' });
  }
});

// PATCH: Update feedback status and admin response
router.patch('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').trim();
    const admin_response = String(req.body.admin_response || '').trim();

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be pending, reviewed, or resolved.'
      });
    }

    const [result] = await db.query(
      'UPDATE feedback_reports SET status = ?, admin_response = ? WHERE id = ?',
      [status, admin_response || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Feedback report not found.' });
    }

    return res.status(200).json({ message: 'Feedback updated successfully!' });
  } catch (error) {
    console.error('Admin update feedback error:', error.message);
    return res.status(500).json({ message: 'Failed to update feedback.' });
  }
});

// DELETE: Delete a feedback report
router.delete('/feedback/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM feedback_reports WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Feedback report not found.' });
    }

    return res.status(200).json({ message: 'Feedback deleted successfully!' });
  } catch (error) {
    console.error('Admin delete feedback error:', error.message);
    return res.status(500).json({ message: 'Failed to delete feedback.' });
  }
});

// GET: Document management oversight (metadata only)
router.get('/documents', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, u.full_name AS user_name, u.email AS user_email
       FROM personal_documents d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.uploaded_at DESC`
    );

    const documents = rows.map((d) => ({
      id: d.id,
      user_id: d.user_id,
      document_name: d.document_name,
      document_type: d.document_type ?? null,
      file_name: d.file_name,
      file_size: d.file_size ?? null,
      mime_type: d.mime_type ?? null,
      uploaded_at: d.uploaded_at ?? null,
      user_name: d.user_name,
      user_email: d.user_email,
    }));

    return res.status(200).json({ documents });
  } catch (error) {
    console.error('Admin list documents error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve documents.' });
  }
});

// DELETE: Remove a document during admin oversight
router.delete('/documents/:id', async (req, res) => {
  try {
    const [docs] = await db.query(
      'SELECT id, file_name FROM personal_documents WHERE id = ?',
      [req.params.id]
    );

    if (docs.length === 0) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const safeFileName = path.basename(docs[0].file_name);
    const filePath = path.join(uploadDir, safeFileName);

    await db.query('DELETE FROM personal_documents WHERE id = ?', [req.params.id]);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({ message: 'Document removed successfully!' });
  } catch (error) {
    console.error('Admin delete document error:', error.message);
    return res.status(500).json({ message: 'Failed to remove document.' });
  }
});

// GET: List managed/custom services
router.get('/services', async (req, res) => {
  try {
    await ensureManagedServicesTable();
    const [services] = await db.query(
      'SELECT * FROM managed_services ORDER BY updated_at DESC'
    );
    return res.status(200).json({ services });
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({ services: [] });
    }
    console.error('Admin list services error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve managed services.' });
  }
});

// POST: Create or upsert a managed service
router.post('/services', async (req, res) => {
  try {
    await ensureManagedServicesTable();
    const service_key = String(req.body.service_key || '').trim();
    const category_id = String(req.body.category_id || '').trim();
    const category_name = String(req.body.category_name || '').trim();
    const service_name = String(req.body.service_name || '').trim();

    if (!service_key || !category_id || !category_name || !service_name) {
      return res.status(400).json({
        message: 'Service key, category ID, category name, and service name are required.'
      });
    }

    const requiredDocs = Array.isArray(req.body.required_documents)
      ? req.body.required_documents
      : String(req.body.required_documents || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

    const applicationSteps =
      req.body.application_steps && typeof req.body.application_steps === 'object'
        ? req.body.application_steps
        : { online: [], offline: [] };

    await db.query(
      `INSERT INTO managed_services
       (service_key, category_id, category_name, service_name, overview, estimated_cost,
        processing_time, relevant_office, required_documents, application_steps, official_link, office_information, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category_id = VALUES(category_id),
         category_name = VALUES(category_name),
         service_name = VALUES(service_name),
         overview = VALUES(overview),
         estimated_cost = VALUES(estimated_cost),
         processing_time = VALUES(processing_time),
         relevant_office = VALUES(relevant_office),
         required_documents = VALUES(required_documents),
         application_steps = VALUES(application_steps),
         official_link = VALUES(official_link),
         office_information = VALUES(office_information),
         is_active = VALUES(is_active)`,
      [
        service_key,
        category_id,
        category_name,
        service_name,
        req.body.overview || '',
        req.body.estimated_cost || 'To be verified',
        req.body.processing_time || 'To be verified',
        req.body.relevant_office || 'To be verified',
        JSON.stringify(requiredDocs),
        JSON.stringify(applicationSteps),
        req.body.official_link || '',
        req.body.office_information || '',
        req.body.is_active === false ? 0 : 1,
      ]
    );

    return res.status(201).json({ message: 'Service saved successfully!' });
  } catch (error) {
    console.error('Admin save service error:', error.message);
    return res.status(500).json({ message: 'Failed to save service.' });
  }
});

// DELETE: Delete a managed service override
router.delete('/services/:key', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM managed_services WHERE service_key = ?',
      [req.params.key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Managed service not found.' });
    }

    return res.status(200).json({ message: 'Managed service deleted successfully!' });
  } catch (error) {
    console.error('Admin delete service error:', error.message);
    return res.status(500).json({ message: 'Failed to delete managed service.' });
  }
});

module.exports = router;
