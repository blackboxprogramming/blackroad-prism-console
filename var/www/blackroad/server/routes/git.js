const express = require('express');
const service = require('./git-service');

const router = express.Router();

async function handleRequest(res, action, { errorStatus = 500, includeOkFlag = false } = {}) {
  try {
    const payload = await action();
    res.json(payload);
  } catch (err) {
    const statusCode = err.statusCode || errorStatus;
    const body = { error: err.message };
    if (includeOkFlag) body.ok = false;
    res.status(statusCode).json(body);
  }
}

router.get('/health', async (req, res) => {
  await handleRequest(res, () => service.gitHealth(), { errorStatus: 500, includeOkFlag: true });
});

router.get('/status', async (req, res) => {
  await handleRequest(res, () => service.gitStatus());
});

router.get('/changes', async (req, res) => {
  await handleRequest(res, () => service.gitChanges());
});

router.post('/stage', async (req, res) => {
  await handleRequest(res, () => service.gitStage(req.body?.files), { errorStatus: 400 });
});

router.post('/unstage', async (req, res) => {
  await handleRequest(res, () => service.gitUnstage(req.body?.files), { errorStatus: 400 });
});

router.post('/commit', async (req, res) => {
  await handleRequest(res, () => service.gitCommit(req.body), { errorStatus: 400 });
});

router.get('/history', async (req, res) => {
  await handleRequest(res, () => service.gitHistory({ limit: req.query?.limit }));
});

async function applyPatchesHandler(req, res) {
  await handleRequest(res, () => service.applyPatches(req.body?.patches), { errorStatus: 400 });
}

router.post('/apply', applyPatchesHandler);

module.exports = router;
module.exports.applyPatches = applyPatchesHandler;
