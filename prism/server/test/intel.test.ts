import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildServer } from '../src/index';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('diff intel', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-intel-'));
  let app = buildServer();
  beforeAll(async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'src/foo.test.ts'), 'test');
    fs.mkdirSync(path.join(tmp, 'tests'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'tests/test_module.py'), 'test');
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
  });
  it('intel for js patch', async () => {
    const patch = '*** Begin Patch\n*** Update File: src/foo.ts\n@@\n-export function a(){};\n+export function a(){return 1};\n*** End Patch';
    const res = await request(app.server).post('/intel/diff').send({ projectId: 'p', diffs: [{ path: 'src/foo.ts', patch }] });
    expect(res.body.intel[0].testsPredicted[0].file).toBe('src/foo.test.ts');
  });
  it('intel for python patch', async () => {
    const patch = '*** Begin Patch\n*** Update File: src/module.py\n@@\n-def a():\n-  pass\n+def a():\n+  return 1\n*** End Patch';
    const res = await request(app.server).post('/intel/diff').send({ projectId: 'p', diffs: [{ path: 'src/module.py', patch }] });
    expect(res.body.intel[0].testsPredicted[0].file).toBe('tests/test_module.py');
  });
});
