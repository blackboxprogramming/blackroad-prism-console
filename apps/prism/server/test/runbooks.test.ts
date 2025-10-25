import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import Fastify from "fastify";
import request from "supertest";
import runbookRoutes from "../api/runbooks";
import diffRoutes from "../api/diffs";
import eventRoutes, { resetEventLogForTest } from "../api/events";
import fs from "fs";
import path from "path";

const WORK_DIR = path.resolve(process.cwd(), "prism/work");

beforeAll(() => {
  fs.mkdirSync(WORK_DIR, { recursive: true });
});

describe("runbooks API", () => {
  beforeEach(() => {
    resetEventLogForTest();
  });

  it("matches python import error", async () => {
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    ctx.stderr = "ModuleNotFoundError: x";
    ctx.lang = "python";
    await app.ready();
    const res = await request(app.server)
      .post("/runbooks/match")
      .send({ projectId: "p1" });
    expect(res.status).toBe(200);
    expect(res.body.runbooks[0].id).toBe("python-importerror");
  });

  it("env probe detects variable", async () => {
    process.env.GOOGLE_CLIENT_ID = "abc";
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    ctx.lang = "python";
    await app.ready();
    const res = await request(app.server)
      .post("/runbooks/python-importerror/probe")
      .send({ projectId: "p1" });
    expect(res.body.answers.google_client_id).toBe(true);
  });

  it("synthesizes diff plan", async () => {
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    ctx.lang = "python";
    await app.ready();
    const res = await request(app.server)
      .post("/runbooks/python-importerror/plan")
      .send({ projectId: "p1", answers: { venv: false, module_name: "foo" } });
    expect(res.body.diffs[0].path).toBe("requirements.txt");
    expect(res.body.diffs[0].content).toContain("foo");
  });
});

describe("diff apply", () => {
  beforeEach(() => {
    resetEventLogForTest();
  });

  it("applies selected hunks only", async () => {
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    await app.register(diffRoutes);
    await app.register(eventRoutes);
    await app.ready();
    const file = path.join(WORK_DIR, "test.txt");
    fs.writeFileSync(file, "base\n");
    const res = await request(app.server)
      .post("/diffs/apply")
      .send({
        diffs: [{ path: "test.txt", hunks: ["A", "B"] }],
        selection: { "test.txt": [0] },
      });
    expect(res.status).toBe(200);
    const content = fs.readFileSync(file, "utf8");
    expect(content).toContain("A");
    expect(content).not.toContain("B");

    const eventsRes = await request(app.server).get("/events");
    expect(eventsRes.body.events[0].topic).toBe("actions.file.write");
    expect(eventsRes.body.events[0].payload.path).toBe("test.txt");
  });
});

describe("events API", () => {
  beforeEach(() => {
    resetEventLogForTest();
  });

  it("captures plan events emitted by runbooks", async () => {
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    ctx.lang = "python";
    await app.register(eventRoutes);
    await app.ready();

    await request(app.server)
      .post("/runbooks/python-importerror/plan")
      .send({ projectId: "p1", answers: { venv: false, module_name: "foo" } });

    const res = await request(app.server).get("/events");
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBeGreaterThanOrEqual(1);
    const evt = res.body.events[0];
    expect(evt.topic).toBe("intents.plan.synthesized");
    expect(evt.payload.diffs).toBeGreaterThanOrEqual(0);
  });

  it("filters events using the since cursor", async () => {
    const app = Fastify();
    const ctx: Record<string, any> = {};
    await app.register(runbookRoutes, { ctx });
    ctx.lang = "python";
    await app.register(eventRoutes);
    await app.ready();

    await request(app.server)
      .post("/runbooks/python-importerror/plan")
      .send({ projectId: "p1", answers: { venv: false, module_name: "foo" } });
    await request(app.server)
      .post("/runbooks/python-importerror/plan")
      .send({ projectId: "p1", answers: { venv: false, module_name: "bar" } });

    const first = await request(app.server).get("/events");
    expect(first.body.events.length).toBeGreaterThanOrEqual(2);
    const cursor = first.body.cursor;
    expect(typeof cursor === "string" || cursor === null).toBeTruthy();

    const sinceParam = cursor ? `?since=${cursor}` : "";
    const second = await request(app.server).get(`/events${sinceParam}`);
    expect(second.body.events).toHaveLength(0);
    expect(second.body.cursor).toBe(cursor);
  });

  it("accepts external event publications", async () => {
    const app = Fastify();
    await app.register(eventRoutes);
    await app.ready();

    const publishRes = await request(app.server)
      .post("/events")
      .send({ topic: "guardian.signal", payload: { status: "ok" }, actor: "guardian" });
    expect(publishRes.status).toBe(200);

    const eventsRes = await request(app.server).get("/events");
    expect(eventsRes.body.events[0].topic).toBe("guardian.signal");
    expect(eventsRes.body.events[0].actor).toBe("guardian");
  });
});
