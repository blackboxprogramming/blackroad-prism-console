'use strict';

const express = require('express');
const { requireAuth } = require('../auth');
const data = require('../../backend/data');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const tasks = data.getAllTasks();
  res.json({ ok: true, tasks });
});

router.post('/', requireAuth, (req, res) => {
  const { project_id, title, status } = req.body || {};
  if (!project_id || !title) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const task = data.addTask(project_id, title, status);
  res.json({ ok: true, task });
});

router.put('/:id', requireAuth, (req, res) => {
  const { title, status } = req.body || {};
  const task = data.updateTask(req.params.id, { title, status });
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, task });
});

router.delete('/:id', requireAuth, (req, res) => {
  data.deleteTask(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
