import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { Client } from 'pg';
import { randWeighted, pick } from './util.js';

const PG_URL = process.env.PG_URL!;
const DAYS = Number(process.env.DAYS || 14);
const USERS = Number(process.env.USERS || 500);
const EVENTS = Number(process.env.EVENTS || 15000);
const PURCHASE_RATE = Number(process.env.PURCHASE_RATE || 0.04);   // 4%
const SIGNUP_RATE   = Number(process.env.SIGNUP_RATE   || 0.15);   // 15%
const SESSIONS_PER_USER = Number(process.env.SESSIONS_PER_USER || 3);

const EVENT_NAMES = ['LOGIN','LOGOUT','SIGNUP','PAGEVIEW','CLICK','PURCHASE'] as const;
type Ev = (typeof EVENT_NAMES)[number];

function eventPayload(ev: Ev) {
  switch (ev) {
    case 'PAGEVIEW': return { path: faker.internet.url(), ref: faker.internet.url() };
    case 'CLICK':    return { element: faker.helpers.arrayElement(['#cta','#nav','#footer']), page: faker.internet.url() };
    case 'LOGIN':    return { method: faker.helpers.arrayElement(['password','oauth']) };
    case 'SIGNUP':   return { plan: faker.helpers.arrayElement(['free','pro','team']) };
    case 'PURCHASE': return { sku: faker.string.alphanumeric(8), amount_usd: faker.number.float({ min: 9, max: 199, precision: 0.01 }) };
    default:         return {};
  }
}

function sessionEvents(uid: string, start: Date) {
  const n = faker.number.int({ min: 3, max: 12 });
  const out: Array<{occurred_at: Date; user_id: string; event_name: Ev; payload: any}> = [];
  let t = new Date(start);
  const signedUp = Math.random() < SIGNUP_RATE;
  if (signedUp) out.push({ occurred_at: new Date(t), user_id: uid, event_name: 'SIGNUP', payload: eventPayload('SIGNUP') });

  out.push({ occurred_at: new Date(t), user_id: uid, event_name: 'LOGIN', payload: eventPayload('LOGIN') });
  for (let i = 0; i < n; i++) {
    t = new Date(t.getTime() + faker.number.int({ min: 10_000, max: 120_000 }));
    const ev = randWeighted<Ev>([['PAGEVIEW',4],['CLICK',3],['LOGIN',0.2],['LOGOUT',0.2],['PURCHASE', signedUp ? 0.4 : 0.1]]);
    out.push({ occurred_at: new Date(t), user_id: uid, event_name: ev, payload: eventPayload(ev) });
  }
  if (Math.random() < 0.5) {
    t = new Date(t.getTime() + faker.number.int({ min: 5_000, max: 60_000 }));
    out.push({ occurred_at: t, user_id: uid, event_name: 'LOGOUT', payload: {} });
  }
  return out;
}

async function main() {
  const client = new Client({ connectionString: PG_URL, application_name: 'br-seed-events' });
  await client.connect();

  // ensure schema
  // @ts-ignore
  await client.query(await (await import('node:fs/promises')).readFile(new URL('./schema.sql', import.meta.url), 'utf8'));

  // synthetic users
  const users = Array.from({ length: USERS }, () => faker.string.uuid());

  const events: Array<{ id: string; occurred_at: Date; user_id: string; event_name: Ev; payload: any }> = [];
  const now = new Date();
  for (const u of users) {
    const sessions = faker.number.int({ min: 1, max: SESSIONS_PER_USER });
    for (let s = 0; s < sessions; s++) {
      const daysAgo = faker.number.int({ min: 0, max: DAYS });
      const start = new Date(now.getTime() - daysAgo * 86400_000 - faker.number.int({ min: 0, max: 6 * 3600_000 }));
      const ses = sessionEvents(u, start);
      for (const e of ses) {
        events.push({ id: faker.string.uuid(), ...e });
      }
    }
  }

  // downsample/trim to target EVENTS
  while (events.length > EVENTS) events.splice(Math.floor(Math.random() * events.length), 1);

  // Ensure some purchases per PURCHASE_RATE
  const purchaseUsers = new Set<string>();
  for (const e of events) if (e.event_name === 'PURCHASE') purchaseUsers.add(e.user_id);
  const wantPurchasers = Math.floor(USERS * PURCHASE_RATE);
  while (purchaseUsers.size < wantPurchasers) {
    const uid = pick(users);
    const t = new Date(now.getTime() - faker.number.int({ min: 0, max: DAYS }) * 86400_000);
    events.push({ id: faker.string.uuid(), occurred_at: t, user_id: uid, event_name: 'PURCHASE', payload: eventPayload('PURCHASE') });
    purchaseUsers.add(uid);
  }

  // batch insert
  events.sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
  const batchSize = 1000;
  for (let i = 0; i < events.length; i += batchSize) {
    const chunk = events.slice(i, i + batchSize);
    const values: any[] = [];
    const rows = chunk.map((e, idx) => {
      const b = idx * 5;
      values.push(e.id, e.occurred_at.toISOString(), e.user_id, e.event_name, JSON.stringify(e.payload));
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5}::jsonb)`;
    }).join(',');
    await client.query(`insert into app.events(id, occurred_at, user_id, event_name, payload) values ${rows} on conflict (id) do nothing`, values);
    process.stdout.write(`\rInserted ${Math.min(i + batchSize, events.length)}/${events.length}`);
  }
  console.log(`\nDone.`);

  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
