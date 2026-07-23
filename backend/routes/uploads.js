const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../data/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|tar|gz|txt|md|csv|json|xml|cpp|c|py|java|js)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed.'));
    }
  }
});

router.get('/', requireAuth, requireRole('teacher'), (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = '';
  let params = [];
  if (req.user.role === 'user') {
    where = 'WHERE f.user_id = ?';
    params = [req.user.id];
  }
  const total = db.prepare(`SELECT COUNT(*) as c FROM uploaded_files f ${where}`).get(...params).c;
  const files = db.prepare(`
    SELECT f.*, u.username
    FROM uploaded_files f LEFT JOIN users u ON f.user_id = u.id
    ${where} ORDER BY f.id DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);
  res.json({ total, page: parseInt(page), limit: parseInt(limit), files });
});

router.post('/', requireAuth, requireRole('teacher'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: 'No file uploaded.' });
  }

  const userSize = db.prepare('SELECT COALESCE(SUM(size), 0) as total FROM uploaded_files WHERE user_id = ?').get(req.user.id).total;
  if (userSize + req.file.size > 2 * 1024 * 1024 * 1024) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: '用户文件总大小超过 2GB 限制。' });
  }

  db.prepare('INSERT INTO uploaded_files (user_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size
  );
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, original_name: req.file.originalname, size: req.file.size });
});

router.get('/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ code: 3, reason: 'ERR_NOT_FOUND', message: 'File not found.' });
  }
  res.sendFile(filePath);
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(req.params.id);
  if (!file) {
    return res.status(404).json({ code: 3, reason: 'ERR_NOT_FOUND', message: 'File not found.' });
  }
  const filePath = path.join(uploadDir, file.filename);
  try { fs.unlinkSync(filePath); } catch {}
  db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(file.id);
  res.json({ message: 'File deleted.' });
});

module.exports = router;
