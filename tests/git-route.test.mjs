// Verify that the git route's applyPatches function writes a diff to disk and
// reports success.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import gitServiceModule from '../var/www/blackroad/server/routes/git-service.js';
const gitService = gitServiceModule.default || gitServiceModule;

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

const result = await gitService.applyPatches([{ path: tempFile, diff }]);
assert.equal(result.applied[tempFile], 'ok');
const content = await fs.readFile(abs, 'utf8');
assert.equal(content, 'new\n');
await fs.unlink(abs);

