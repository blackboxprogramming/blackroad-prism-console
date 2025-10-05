import { describe, expect, it } from 'vitest';
import {
  DeliveryEngine,
  FilingService,
  Gatekeeper,
  InMemoryClientOS,
  InMemoryLicenseMatrix,
  InMemoryRegDeskRepository,
  StubEmailDeliveryClient,
  StubIARDClient,
  StubStatePortalClient,
  createMaterialChangeEvents,
  generateEvents
} from '../src/index.js';
import type { Rule } from '@blackroad/regdesk-rules';
import { StaticComplianceOS } from '@blackroad/regdesk-integrations';
import { validateWormChain } from '../src/utils/repository.js';

const advRule: Rule = {
  key: 'RIA-ADV-ANNUAL-AMEND',
  track: 'RIA',
  schedule: {
    freq: 'ANNUAL',
    offsetFrom: 'FISCAL_YEAR_END',
    offsetDays: 120
  },
  filing: {
    type: 'IARD',
    formKeys: ['ADV-PART1'],
    feePolicy: 'CALCULATED',
    artifactsRequired: ['PDF']
  },
  delivery: {
    docKind: 'ADV_2A',
    trigger: 'ANNUAL',
    methodsAllowed: ['EMAIL'],
    proofRequired: ['EVIDENCE']
  },
  gates: {
    blockActions: ['advise'],
    graceDays: 0
  }
};

describe('schedule generation', () => {
  it('generates due date 120 days after fiscal year end', async () => {
    const repo = new InMemoryRegDeskRepository();
    const fiscalYearEnd = new Date(Date.UTC(2024, 11, 31));
    await generateEvents({
      range: { from: new Date('2025-01-01T00:00:00Z'), to: new Date('2025-12-31T23:59:59Z') },
      rules: [advRule],
      context: {
        fiscalYearEnd,
        licenseExpiries: {},
        anniversaries: {}
      },
      repo,
      actor: 'tester'
    });
    const events = await repo.listRegEvents();
    expect(events).toHaveLength(1);
    expect(events[0].due.toISOString().slice(0, 10)).toEqual('2025-04-30');
  });
});

describe('gatekeeper', () => {
  it('blocks advise when overdue and lifts when resolved', async () => {
    const repo = new InMemoryRegDeskRepository();
    const due = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
    await repo.upsertRegEvent({
      key: advRule.key,
      track: 'RIA',
      stateCode: null,
      frequency: 'ANNUAL',
      due,
      status: 'Open',
      opensAt: null,
      closesAt: null,
      blockers: []
    });
    const gatekeeper = new Gatekeeper({ repo, rules: [advRule], actor: 'tester', now: new Date() });
    await gatekeeper.evaluate();
    const status = await gatekeeper.check('advise');
    expect(status.allowed).toBe(false);
    await repo.updateRegEventStatus((await repo.listRegEvents())[0].id, 'Accepted');
    await gatekeeper.evaluate();
    const statusAfter = await gatekeeper.check('advise');
    expect(statusAfter.allowed).toBe(true);
  });
});

describe('deliveries', () => {
  it('delivers to clients with evidence and is idempotent', async () => {
    const repo = new InMemoryRegDeskRepository();
    const engine = new DeliveryEngine({
      repo,
      clientOS: new InMemoryClientOS([
        { id: 'C123', email: 'c123@example.com' },
        { id: 'C456', email: 'c456@example.com' }
      ]),
      email: new StubEmailDeliveryClient(),
      actor: 'tester'
    });
    const request = {
      docKind: 'FORM_CRS' as const,
      clients: ['C123', 'C456'],
      method: 'EMAIL' as const,
      evidencePath: '/tmp/proof.pdf',
      version: '2025.1'
    };
    const first = await engine.deliver(request);
    expect(first).toHaveLength(2);
    const second = await engine.deliver(request);
    expect(second).toHaveLength(2);
    expect(second[0].id).toEqual(first[0].id);
  });
});

describe('filing artifacts', () => {
  it('prevents submission without artifacts', async () => {
    const repo = new InMemoryRegDeskRepository();
    const licenseMatrix = new InMemoryLicenseMatrix([], '2024-12-31');
    const compliance = new StaticComplianceOS([]);
    const filingService = new FilingService({
      repo,
      licenseMatrix,
      compliance,
      iard: new StubIARDClient(),
      statePortal: new StubStatePortalClient(),
      actor: 'tester'
    });
    const event = await repo.upsertRegEvent({
      key: advRule.key,
      track: 'RIA',
      stateCode: null,
      frequency: 'ANNUAL',
      due: new Date(),
      status: 'Open',
      opensAt: null,
      closesAt: null,
      blockers: []
    });
    const filing = await filingService.build(event, advRule);
    await expect(filingService.submit(filing.id)).rejects.toThrow(
      'Cannot submit filing without artifacts'
    );
  });
});

describe('material change', () => {
  it('creates material change delivery event', async () => {
    const repo = new InMemoryRegDeskRepository();
    const policy = {
      id: 'POL-1',
      title: 'Code of Ethics',
      version: 2,
      effectiveDate: new Date().toISOString(),
      materialToClients: true
    };
    const event = await createMaterialChangeEvents({ policy, repo, actor: 'tester' });
    expect(event.key).toEqual('ADV-CRS-MATERIAL-DELIVERY');
    const again = await createMaterialChangeEvents({ policy, repo, actor: 'tester' });
    expect(again.id).toEqual(event.id);
  });
});

describe('WORM verification', () => {
  it('detects tampering', async () => {
    const repo = new InMemoryRegDeskRepository();
    await repo.appendWormBlock({ actor: 'tester', action: 'seed' });
    await repo.appendWormBlock({ actor: 'tester', action: 'second' });
    const chain = await repo.listWormBlocks();
    expect(chain).toHaveLength(2);
    expect(() => validateWormChain(chain)).not.toThrow();
    chain[1].hash = 'tampered';
    expect(() => validateWormChain(chain)).toThrow();
  });
});
