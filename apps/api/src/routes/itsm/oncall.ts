import { Router } from 'express';
import yaml from 'yaml';
import fs from 'fs';
import fetch from 'node-fetch';
const r = Router();

function load() {
  return yaml.parse(fs.readFileSync('itsm/oncall/schedules.yaml','utf-8'));
}

r.get('/oncall/:team/now', (req, res) => {
  const team = String(req.params.team);
  const cfg = load();
  const rot = cfg.teams?.[team]?.rotation || [];
  const primary = rot[0] || null;
  res.json({ team, primary, rotation: rot });
});

r.post('/page', async (req, res) => {
  const { team, severity, summary, details } = req.body || {};
  if (!team || !severity || !summary) return res.status(400).json({ error:'bad_request' });
  const cfg = load();
  const esc = cfg.teams?.[team]?.escalation || [];
  const txt = `[PAGE] ${severity} — ${summary}\n${details||''}`;
  for (const tgt of esc) {
    if (tgt.startsWith('slack:') && process.env.SLACK_WEBHOOK) {
      await fetch(process.env.SLACK_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: txt }) }).catch(()=>null);
    }
    // SMS/email hooks could be implemented here using existing notify routes
  }
  res.json({ ok:true });
});

export default r;
