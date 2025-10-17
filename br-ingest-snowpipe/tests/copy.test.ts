import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/snowflake.js', () => ({
  sfExec: vi.fn(),
}));

import { copyInto } from '../src/copy.js';
import { sfExec } from '../src/snowflake.js';

type Mocked<T> = T extends (...args: infer A) => infer R ? vi.Mock<R, A> : never;

describe('Snowpipe copy', () => {
  it('builds a COPY INTO statement for the provided stage and table', async () => {
    (sfExec as Mocked<typeof sfExec>).mockResolvedValue('statement-id');
    const connection = {} as any;

    await copyInto(connection, { stage: 'RAW_STAGE', prefix: '2024/05/01', table: 'RAW_TABLE' });

    expect(sfExec).toHaveBeenCalledTimes(1);
    const [conn, sql] = (sfExec as Mocked<typeof sfExec>).mock.calls[0] as [unknown, string];
    expect(conn).toBe(connection);
    expect(sql).toContain('COPY INTO RAW_TABLE');
    expect(sql).toContain("FROM @RAW_STAGE/2024/05/01");
    expect(sql).toMatch(/PATTERN = '\.\*\\.csv\\.gz'/);
  });
});
