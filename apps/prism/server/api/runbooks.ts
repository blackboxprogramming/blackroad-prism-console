import { FastifyInstance } from "fastify";
import { z } from "zod";
import { loadRunbooks } from "../runbooks/loader";
import { findCandidates, runProbes, synthesizePlan } from "../runbooks/engine";
import path from "path";
import { EventEmitter } from "events";

export const events = new EventEmitter();

export async function runbookRoutes(fastify: FastifyInstance) {
  const runbooks = loadRunbooks();

  fastify.decorate("ctx", {
    stderr: "",
    stdout: "",
    diffs: [] as string[],
    exitCode: 0,
    lang: "generic",
  });

  fastify.post("/runbooks/match", async (req) => {
    const body = z
      .object({
        projectId: z.string(),
        sessionId: z.string().optional(),
      })
      .parse(req.body);
    const candidates = findCandidates(runbooks, fastify.ctx);
    return { runbooks: candidates.map((r) => ({ id: r.id, title: r.title })) };
  });

  fastify.get("/runbooks/:id", async (req) => {
    const id = (req.params as any).id as string;
    const rb = runbooks.find((r) => r.id === id);
    if (!rb) return {};
    const { plan, ...rest } = rb;
    return rest;
  });

  fastify.post("/runbooks/:id/probe", async (req) => {
    const id = (req.params as any).id as string;
    const rb = runbooks.find((r) => r.id === id);
    if (!rb) return { answers: {} };
    const answers = await runProbes(rb, fastify.ctx);
    return { answers };
  });

  fastify.post("/runbooks/:id/plan", async (req) => {
    const id = (req.params as any).id as string;
    const rb = runbooks.find((r) => r.id === id);
    if (!rb) return { diffs: [], cmds: [] };
    const body = z
      .object({ projectId: z.string(), answers: z.record(z.any()) })
      .parse(req.body);
    const plan = synthesizePlan(rb, body.answers);
    const size = Buffer.byteLength(JSON.stringify(plan.diffs));
    if (size > 1024 * 1024) throw new Error("diff too large");
    plan.diffs.forEach((d) => {
      const resolved = path.normalize(d.path);
      if (resolved.includes("..")) throw new Error("bad path");
    });
    events.emit("plan", { id, diffs: plan.diffs.length, cmds: plan.cmds.length });
    return plan;
  });
}

export default runbookRoutes;
