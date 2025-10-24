import assert from 'node:assert/strict';
import { RequestInit, Response } from 'node-fetch';
import { createClient } from '../src/resources/client.js';

async function main() {
  const calls: { path: string; init: RequestInit | undefined }[] = [];
  const client = createClient({
    baseUrl: 'https://sandbox.api.blackroad.io',
    token: 'test-token',
    fetchImpl: async (input, init) => {
      calls.push({ path: input.toString(), init });
      return new Response(JSON.stringify({ jobId: 'job_1', status: 'queued', estimatedCompletionSeconds: 30 }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const job = await client.captions.create({
    assetUrl: 'https://cdn.blackroad.io/demo.mp4',
    sourceLanguage: 'en',
    targetLanguages: ['es'],
  });

  assert.equal(job.jobId, 'job_1');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].path.endsWith('/v1/captions'));
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer test-token');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
