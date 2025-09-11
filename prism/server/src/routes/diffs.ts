import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPatch, applyPatch } from 'diff';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { PrismDiff, PrismEvent } from '@prism/core';
import { insertEvent } from '../db/sqlite';
import { broadcast } from '../bus/sse';

const diffSchema: z.ZodType<PrismDiff> = z.object({
  path: z.string(),
  beforeSha: z.string(),
  afterSha: z.string(),
  patch: z.string(),
  testsPredicted: z.array(z.string()).optional()
});

export default async function diffsRoutes(fastify: FastifyInstance) {
  fastify.post('/diffs/propose', async (req, reply) => {
    const body = z.object({ files: z.record(z.string()) }).parse(req.body);
    const diffs: PrismDiff[] = Object.entries(body.files).map(([p, content]) => {
      const patch = createPatch(p, '', content);
      return {
        path: p,
        beforeSha: createHash('sha1').update('').digest('hex'),
        afterSha: createHash('sha1').update(content).digest('hex'),
        patch
      };
    });
    reply.send(diffs);
  });

  fastify.post('/diffs/apply', async (req, reply) => {
    const body = z.object({ diffs: z.array(diffSchema), message: z.string() }).parse(req.body);
    const workRoot = path.resolve(process.cwd(), '../work');
    for (const d of body.diffs) {
      const result = applyPatch('', d.patch);
      const target = path.join(workRoot, d.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, result);
      const event: PrismEvent = {
        id: nanoid(),
        ts: new Date().toISOString(),
        actor: 'lucidia',
        kind: 'file.write',
        projectId: 'local',
        sessionId: 'local',
        facet: 'space',
        summary: d.path,
        ctx: { message: body.message }
      };
      insertEvent(event);
      broadcast(event);
    }
    const commitSha = createHash('sha1').update(JSON.stringify(body)).digest('hex');
    reply.send({ commitSha });
  });
}
