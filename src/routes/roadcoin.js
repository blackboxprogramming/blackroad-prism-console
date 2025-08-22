import express from 'express';

const router = express.Router();

let balance = 100;
let transactions = [
  { id: 1, date: new Date().toISOString(), amount: 100, type: 'credit' }
];

router.get('/wallet', (_req, res) => {
  res.json({ balance, transactions });
});

router.post('/mint', (_req, res) => {
  balance += 10;
  const tx = { id: transactions.length + 1, date: new Date().toISOString(), amount: 10, type: 'mint' };
  transactions.unshift(tx);
  res.json({ balance, transactions });
});

export default router;
