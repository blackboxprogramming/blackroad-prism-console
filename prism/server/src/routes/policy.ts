import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { Policy } from '@prism/core';

const approval = z.enum(['auto','review','forbid']);
const policySchema: z.ZodType<Policy> = z.object({
  mode: z.enum(['playground','dev','trusted','prod']),
  approvals: z.object({
    read: approval.optional(),
    write: approval.optional(),
    exec: approval.optional(),
    net: approval.optional(),
    secrets: approval.optional(),
    dns: approval.optional(),
    deploy: approval.optional()
  }).partial()
});

const policyPath = path.resolve(process.cwd(), '../configs/prism.config.yaml');

function readPolicy(): Policy {
  if (!fs.existsSync(policyPath)) {
    return { mode: 'dev', approvals: {} };
  }
  const txt = fs.readFileSync(policyPath, 'utf-8');
  return yaml.parse(txt) as Policy;
}

export default async function policyRoutes(fastify: FastifyInstance) {
  fastify.get('/policy', async (_req, reply) => {
    reply.send(readPolicy());
  });

  fastify.put('/policy', async (req, reply) => {
    const body = policySchema.parse(req.body);
    fs.mkdirSync(path.dirname(policyPath), { recursive: true });
    fs.writeFileSync(policyPath, yaml.stringify(body));
    reply.send({ ok: true });
  });
}
