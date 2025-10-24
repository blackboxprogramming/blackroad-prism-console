import { Router } from 'express';
import { hasScope } from '../middleware/auth.js';
import { emitAuditEvent } from '../../lib/otel.js';

const router = Router();
const simulations = new Map<string, { status: string; artifacts: { kind: string; url: string; mimeType: string }[] }>();

router.post('/', (req, res) => {
  if (!hasScope(req, 'sim:write')) {
    res.status(403).json({ error: { code: 'forbidden', message: 'sim:write scope required' } });
    return;
  }

  const simulationId = `sim_${Date.now()}`;
  simulations.set(simulationId, { status: 'running', artifacts: [] });
  emitAuditEvent({
    actor: req.auth?.actor?.id ?? 'unknown',
    action: 'simulation.create',
    subject: simulationId,
    metadata: req.body,
  });

  res.status(202).json({ simulationId, status: 'running' });
});

router.get('/:simulationId', (req, res) => {
  const simulation = simulations.get(req.params.simulationId);
  if (!simulation) {
    res.status(404).json({ error: { code: 'not_found', message: 'Simulation not found' } });
    return;
  }
  res.json({
    simulationId: req.params.simulationId,
    status: simulation.status,
    submittedAt: new Date().toISOString(),
    artifacts: simulation.artifacts,
  });
});

router.get('/:simulationId/artifacts', (req, res) => {
  const simulation = simulations.get(req.params.simulationId);
  if (!simulation) {
    res.status(404).json({ error: { code: 'not_found', message: 'Simulation not found' } });
    return;
  }
  res.json({ simulationId: req.params.simulationId, artifacts: simulation.artifacts });
});

export default router;
