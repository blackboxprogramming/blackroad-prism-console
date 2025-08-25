'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const store = require('../services/connectorStore');

const SERVICES = ['gmail','calendar','contacts'];

router.get('/google/start', requireAuth, (req,res)=>{
  const { service } = req.query;
  if(!SERVICES.includes(service)) return res.status(400).json({ ok:false, error:'invalid_service' });
  // In real implementation, build Google OAuth URL. Here, return redirect placeholder.
  const url = (process.env.GOOGLE_REDIRECT_URI || '/subscribe') + `?connected=${service}`;
  res.json({ url });
});

router.get('/google/callback', requireAuth, (req,res)=>{
  const { service } = req.query;
  if(!SERVICES.includes(service)) return res.status(400).send('invalid_service');
  store.connect(req.session.userId, service);
  res.redirect(`/subscribe?connected=${service}`);
});

router.post('/google/revoke', requireAuth, (req,res)=>{
  const { service } = req.body || {};
  if(!SERVICES.includes(service)) return res.status(400).json({ ok:false, error:'invalid_service' });
  store.revoke(req.session.userId, service);
  res.json({ ok:true });
});

module.exports = router;
