import { addDays, isAfter } from 'date-fns';
import type { Rule } from '@blackroad/regdesk-rules';
import { appendAuditLog } from '../audit/worm.js';
import type { RegDeskRepository } from '../utils/repository.js';

export interface GatekeeperDeps {
  repo: RegDeskRepository;
  rules: Rule[];
  actor: string;
  now?: Date;
}

function latestGate(gates: Awaited<ReturnType<RegDeskRepository['listGates']>>) {
  return gates
    .slice()
    .sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0))
    .pop();
}

export class Gatekeeper {
  private ruleByKey = new Map<string, Rule>();

  constructor(private readonly deps: GatekeeperDeps) {
    for (const rule of deps.rules) {
      this.ruleByKey.set(rule.key, rule);
    }
  }

  async evaluate(): Promise<void> {
    const now = this.deps.now ?? new Date();
    const openEvents = await this.deps.repo.listRegEvents({ status: 'Open' });
    const blockByAction = new Map<string, { reason: string; eventId: string }>();

    for (const event of openEvents) {
      const rule = this.ruleByKey.get(event.key);
      if (!rule || !rule.gates) {
        continue;
      }
      const grace = rule.gates.graceDays ?? 0;
      const dueWithGrace = addDays(event.due, grace);
      if (isAfter(now, dueWithGrace)) {
        for (const action of rule.gates.blockActions) {
          blockByAction.set(action, {
            reason: `${event.key} overdue by ${Math.ceil(
              (now.getTime() - dueWithGrace.getTime()) / (1000 * 60 * 60 * 24)
            )} days`,
            eventId: event.id
          });
        }
      }
    }

    const actions = new Set<string>([
      'advise',
      'market',
      'open_account',
      'trade_bd',
      'sell_insurance'
    ]);

    for (const action of actions) {
      const existing = latestGate(await this.deps.repo.listGates({ action: action as any }));
      const block = blockByAction.get(action);
      if (block) {
        if (!existing || existing.allowed) {
          await this.createGate(action, false, block.reason, block.eventId);
        }
      } else if (!existing || !existing.allowed) {
        await this.createGate(action, true, 'No overdue dependencies');
      }
    }
  }

  async check(action: string) {
    const gates = await this.deps.repo.listGates({ action: action as any });
    const current = latestGate(gates);
    if (!current) {
      return { allowed: true, reason: 'No gate set' };
    }
    return { allowed: current.allowed, reason: current.reason };
  }

  private async createGate(action: string, allowed: boolean, reason?: string, eventId?: string) {
    await this.deps.repo.createGate({
      action: action as any,
      allowed,
      reason,
      context: eventId ? { eventId } : {}
    });
    await appendAuditLog(this.deps.repo, {
      actor: this.deps.actor,
      action: 'gate.update',
      entity: action,
      allowed,
      reason
    });
  }
}
