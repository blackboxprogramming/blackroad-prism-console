const express = require('express');
const { handle } = require('../controllers/guardianController');

const router = express.Router();

router.post('/', handle);

module.exports = router;
