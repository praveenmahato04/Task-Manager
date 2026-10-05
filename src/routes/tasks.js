const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
const STATUSES = ['todo', 'in_progress', 'done'];

router.use(authenticate); // every task route is protected

// CREATE
router.post('/', (req, res) => {
  const { title, description = '', status = 'todo' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  const info = db
    .prepare('INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)')
    .run(req.user.id, title, description, status);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

// READ all (optional ?status=)
router.get('/', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY id DESC').all(req.user.id, status)
    : db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json(rows);
});

// READ one
router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// UPDATE
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { title = task.title, description = task.description, status = task.status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  db.prepare("UPDATE tasks SET title=?, description=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .run(title, description, status, task.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

// DELETE
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

module.exports = router;
