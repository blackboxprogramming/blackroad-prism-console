'use strict';

const express = require('express');
const router = express.Router();

router.use('/health', require('./health'));
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/agents', require('./agents'));
router.use('/wallet', require('./wallet'));
router.use('/notes', require('./notes'));
router.use('/projects', require('./projects'));
router.use('/', require('./tasks'));
router.use('/timeline', require('./timeline'));
router.use('/contradictions', require('./contradictions'));
router.use('/logs', require('./logs'));
router.use('/commits', require('./commits'));
router.use('/metrics', require('./metrics'));
router.use('/llm', require('./llm'));
router.use('/lucidia', require('./lucidia'));
router.use('/pi', require('./pi'));
router.use('/roadbook', require('./roadbook'));
router.use('/deploy', require('./deploy'));
router.use('/json', require('./json'));
// subscription routes handled directly in server_full.js
router.use('/connect', require('./connect'));
const subscribe = require('./subscribe');
router.use('/', subscribe.router);

module.exports = router;
