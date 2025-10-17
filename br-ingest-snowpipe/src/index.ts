import 'dotenv/config';
import { format } from 'date-fns';
import { pool, getWatermark, setWatermark } from './pg.js';
import { uploadStream } from './s3.js';
import { sfConnect } from './snowflake.js';
import { copyInto } from './copy.js';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import { format as csvFormat } from 'fast-csv';

async function main() {
  const source = process.env.WATERMARK_SOURCE || 'pg.app.events';
  const wm = await getWatermark(source);

  const client = await pool.connect();
  const query = process.env.PG_SOURCE_QUERY!;
  const batchRows = Number(process.env.BATCH_ROWS || 10000);

  const now = new Date();
  const prefix = `${process.env.S3_PREFIX}/${format(now, 'yyyy/MM/dd')}`;
  const key = `${prefix}/${format(now, 'HHmm')}-${process.env.GITHUB_SHA ?? Date.now()}.csv.gz`;

  const cursorName = 'br_cursor_' + Math.random().toString(36).slice(2, 8);
  await client.query(`BEGIN; DECLARE ${cursorName} NO SCROLL CURSOR FOR ${query}`, [wm.toISOString()]);
  let total = 0;

  while (true) {
    const { rows } = await client.query(`FETCH FORWARD ${batchRows} FROM ${cursorName}`);
    if (!rows.length) break;
    total += rows.length;

    const csv = csvFormat({ headers: true });
    const gz = createGzip();

    const body = csv.transform((r: any) => r).pipe(gz) as Readable;
    const put = uploadStream({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: 'text/csv',
      ContentEncoding: 'gzip'
    });

    rows.forEach((r: any) => csv.write(r));
    csv.end();
    await put;
  }

  await client.query(`CLOSE ${cursorName}; COMMIT;`);
  client.release();

  if (total === 0) {
    console.log('No new rows; exiting.');
    return;
  }

  const conn = await sfConnect();
  await copyInto(conn, {
    stage: process.env.SNOWFLAKE_STAGE!,
    prefix,
    table: process.env.SNOWFLAKE_TARGET_TABLE!
  });

  await setWatermark(source, now);
  console.log(`Loaded ${total} rows to Snowflake from s3://${process.env.S3_BUCKET}/${prefix}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
