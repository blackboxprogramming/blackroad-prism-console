import type snowflake from 'snowflake-sdk';

export async function copyInto(
  conn: snowflake.Connection,
  opts: {
    stage: string;
    prefix: string;
    table: string;
  }
) {
  const { stage, prefix, table } = opts;
  const fileFormat = 'BR_CSV_GZ';
  const sql = `
    COPY INTO ${table}
    FROM @${stage}/${prefix}
    FILE_FORMAT = (FORMAT_NAME='${fileFormat}')
    PATTERN = '.*\\.csv\\.gz'
    ON_ERROR = 'ABORT_STATEMENT';
  `;
  return (await (await import('./snowflake.js')).sfExec(conn, sql));
}
