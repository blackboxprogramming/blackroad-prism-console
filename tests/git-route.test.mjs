// Verify that the git route's applyPatches function writes a diff to disk and
// reports success.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import git from '../var/www/blackroad/server/routes/git.js';
const { applyPatches } = git;

const tempFile = 'tmp-applyPatches.txt';
const abs = path.join(process.cwd(), tempFile);

await fs.writeFile(abs, 'old\n');
const diff = [
  `--- ${tempFile}`,
  `+++ ${tempFile}`,
  '@@ -1 +1 @@',
  '-old',
  '+new',
  ''
].join('\n');

const req = { body: { patches: [{ path: tempFile, diff }] } };
const res = {
  statusCode: 200,
  status(c) { this.statusCode = c; return this; },
  json(obj) { this.body = obj; }
};

await applyPatches(req, res);
assert.equal(res.body.applied[tempFile], 'ok');
const content = await fs.readFile(abs, 'utf8');
assert.equal(content, 'new\n');
await fs.unlink(abs);

