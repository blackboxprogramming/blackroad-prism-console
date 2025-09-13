import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
  const options = ['PRO_PLAN','STARTER_PLAN'];
  const recommendation = options[Math.floor(Math.random()*options.length)];
  res.json({ recommendation });
});
export default router;
