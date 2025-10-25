import { FastifyInstance } from "fastify";
import { z } from "zod";
import { loadRunbooks } from "../runbooks/loader";
import { findCandidates, runProbes, synthesizePlan } from "../runbooks/engine";
import path from "path";
import { publishEvent } from "../events/bus";

type RunbookContext = {
  stderr: string;
  stdout: string;
  diffs: string[];
  exitCode: number;
  lang: string;
};

interface RunbookPluginOptions {
  ctx?: Partial<RunbookContext>;
}

export async function runbookRoutes(
  fastify: FastifyInstance,
  options: RunbookPluginOptions = {}
) {
  const runbooks = loadRunbooks();

  const defaults: RunbookContext = {
    stderr: "",
    stdout: "",
    diffs: [],
    exitCode: 0,
    lang: "generic",
  };
  if (options.ctx) {
    const ctx = { ...defaults, ...options.ctx };
    Object.assign(options.ctx, ctx);
    (fastify as any).ctx = options.ctx;
  } else {
    (fastify as any).ctx = { ...defaults };
  }

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
    await publishEvent(
      "intents.plan.synthesized",
      {
        runbookId: id,
        projectId: body.projectId,
        diffs: plan.diffs.length,
        cmds: plan.cmds.length,
      },
      { actor: "kindest-coder" }
    );
    return plan;
  });
}

export default runbookRoutes;
