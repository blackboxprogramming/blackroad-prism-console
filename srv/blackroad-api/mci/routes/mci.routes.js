const express = require('express');
const { randomUUID } = require('crypto');
const validators = require('./mci.validators');
const controller = require('./mci.controller');
const limiter = require('../services/mci.limiter');

const router = express.Router();
router.use(express.json({ limit: '32kb' }));
router.use(limiter);
router.use((req, res, next) => {
  req.id = randomUUID();
  next();
});

router.post('/compute', validators.compute, controller.compute);
router.post('/solve', validators.solve, controller.solve);
router.post('/autodiff', validators.autodiff, controller.autodiff);
router.post('/explain', validators.explain, controller.explain);
router.get('/health', controller.health);

module.exports = router;
