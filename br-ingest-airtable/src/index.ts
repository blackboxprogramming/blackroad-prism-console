import 'dotenv/config';
import { withClient, getLastRun, setLastRun } from './pg.js';
import { fetchAirtableSince } from './airtable.js';
import { upsertProjects } from './upsert.js';

async function main() {
  const batchSize = Number(process.env.BATCH_SIZE || 50);
  const last = await getLastRun();
  const since = last?.toISOString();
  const started = new Date();

  let total = 0;
  await withClient(async (client) => {
    for await (const batch of chunked(fetchAirtableSince(since, batchSize), batchSize)) {
      total += await upsertProjects(client, batch);
      process.stdout.write(`\rUpserted: ${total}`);
    }
  });

  await setLastRun(started);
  console.log(`\nDone. Upserted ${total} records since ${since ?? 'beginning'}.`);
}

async function* chunked<T>(iter: AsyncIterable<T>, size: number): AsyncGenerator<T[]> {
  let arr: T[] = [];
  for await (const item of iter) {
    arr.push(item);
    if (arr.length >= size) { yield arr; arr = []; }
  }
  if (arr.length) yield arr;
}

main().catch((e) => { console.error(e); process.exit(1); });
