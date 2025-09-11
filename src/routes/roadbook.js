'use strict';

const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();

// Sample Roadbook data; replace with persistent storage in production.
const roadbookChapters = [
  {
    id: '1',
    title: 'Introduction',
    content: 'Welcome to the Roadbook. This chapter introduces the journey.'
  },
  {
    id: '2',
    title: 'Getting Started',
    content: 'Setup instructions and first steps with code snippets and images.'
  },
  {
    id: '3',
    title: 'Advanced Topics',
    content: 'Deep dive into advanced usage with rich examples.'
  }
];

router.get('/chapters', requireAuth, (req, res) => {
  const chapters = roadbookChapters.map(({ id, title }) => ({ id, title }));
  res.json({ ok: true, chapters });
});

router.get('/chapter/:id', requireAuth, (req, res) => {
  const chapter = roadbookChapters.find(c => c.id === req.params.id);
  if (!chapter) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, chapter });
});

router.get('/search', requireAuth, (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = roadbookChapters
    .filter(c => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q))
    .map(c => ({ id: c.id, title: c.title, snippet: c.content.slice(0, 80) }));
  res.json({ ok: true, results });
});

module.exports = router;
