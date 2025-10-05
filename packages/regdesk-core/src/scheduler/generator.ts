import {
  addDays,
  eachYearOfInterval,
  isWithinInterval,
  set,
  startOfDay
} from 'date-fns';
import type { RegEvent } from '@blackroad/regdesk-db';
import type { Rule } from '@blackroad/regdesk-rules';
import type { RegDeskRepository } from '../utils/repository.js';
import type { ScheduleContext, ScheduleRange } from '../types.js';
import { appendAuditLog } from '../audit/worm.js';

function resolveAnchorDate(rule: Rule, context: ScheduleContext, year: number): Date {
  if (rule.schedule.offsetFrom === 'FISCAL_YEAR_END') {
    const fye = set(context.fiscalYearEnd, { year });
    return fye;
  }
  if (rule.schedule.offsetFrom === 'LICENSE_EXPIRY') {
    const key = rule.stateCode ?? rule.track;
    const date = context.licenseExpiries[key];
    if (!date) {
      throw new Error(`Missing license expiry context for ${rule.key}`);
    }
    return set(date, { year });
  }
  if (rule.schedule.offsetFrom === 'ANNIVERSARY') {
    const key = rule.key;
    const date = context.anniversaries[key];
    if (!date) {
      throw new Error(`Missing anniversary context for ${rule.key}`);
    }
    return set(date, { year });
  }
  if (rule.schedule.dueMonth && rule.schedule.dueDay) {
    return new Date(Date.UTC(year, rule.schedule.dueMonth - 1, rule.schedule.dueDay));
  }
  return new Date(Date.UTC(year, 0, 1));
}

function computeDueDate(rule: Rule, context: ScheduleContext, year: number): Date {
  const anchor = resolveAnchorDate(rule, context, year);
  if (typeof rule.schedule.offsetDays === 'number') {
    return startOfDay(addDays(anchor, rule.schedule.offsetDays));
  }
  return startOfDay(anchor);
}

export interface GenerateOptions {
  range: ScheduleRange;
  rules: Rule[];
  context: ScheduleContext;
  repo: RegDeskRepository;
  actor: string;
}

export async function generateEvents({ range, rules, context, repo, actor }: GenerateOptions) {
  const years = eachYearOfInterval({ start: range.from, end: range.to }).map((date) =>
    date.getUTCFullYear()
  );
  const operations: Array<Promise<RegEvent>> = [];

  for (const rule of rules) {
    for (const year of years) {
      const due = computeDueDate(rule, context, year);
      if (!isWithinInterval(due, { start: range.from, end: range.to })) {
        continue;
      }
      const existing = await repo.findRegEventByKeyAndDue(rule.key, due);
      if (existing) {
        operations.push(
          repo.upsertRegEvent({
            ...existing,
            frequency: rule.schedule.freq as RegEvent['frequency'],
            track: rule.track as RegEvent['track'],
            stateCode: rule.stateCode,
            blockers: existing.blockers
          })
        );
        continue;
      }
      operations.push(
        repo.upsertRegEvent({
          key: rule.key,
          track: rule.track as RegEvent['track'],
          stateCode: rule.stateCode,
          frequency: (rule.schedule.freq === 'WINDOW' ? 'ADHOC' : rule.schedule.freq) as RegEvent['frequency'],
          due,
          opensAt:
            typeof rule.schedule.windowDays === 'number'
              ? addDays(due, -rule.schedule.windowDays)
              : undefined,
          closesAt: undefined,
          status: 'Open',
          blockers: []
        })
      );
    }
  }

  const results = await Promise.all(operations);
  if (results.length) {
    await appendAuditLog(repo, {
      actor,
      action: 'schedule.generate',
      entity: 'RegEvent',
      count: results.length
    });
  }
  return results;
}
