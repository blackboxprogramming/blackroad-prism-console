const express = require('express');
const { authenticateRequest } = require('../middleware/auth');
const { writeAudit } = require('../logger');

const router = express.Router();

router.post('/materialize', authenticateRequest, (req, res) => {
  const identity = req.identity || {};
  writeAudit({
    action: 'secret_materialized',
    subject: identity.subject,
    break_glass: identity.breakGlass,
    audiences: identity.audiences,
    trace_id: req.traceId
  });
  res.status(200).json({
    materialized: true,
    break_glass: identity.breakGlass,
    subject: identity.subject
  });
});

module.exports = router;
