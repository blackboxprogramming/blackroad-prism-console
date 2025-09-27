import snowflake from 'snowflake-sdk';

export function sfConnect() {
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USER!,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE!,
    schema: process.env.SNOWFLAKE_SCHEMA!,
    clientSessionKeepAlive: true
  });
  return new Promise<snowflake.Connection>((resolve, reject) =>
    connection.connect((err, conn) => (err ? reject(err) : resolve(conn)))
  );
}

export async function sfExec(conn: snowflake.Connection, sql: string) {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err, stmt, _rows) => (err ? reject(err) : resolve(stmt.getStatementId()))
    });
  });
}
