import { describe, it, expect, beforeAll } from "vitest";
import Fastify from "fastify";
import request from "supertest";
import runbookRoutes, { events } from "../api/runbooks";
import diffRoutes from "../api/diffs";
import fs from "fs";
import path from "path";

const WORK_DIR = path.resolve(process.cwd(), "prism/work");

beforeAll(() => {
  fs.mkdirSync(WORK_DIR, { recursive: true });
});

describe("runbooks API", () => {
  it("matches python import error", async () => {
    const app = Fastify();
    app.register(runbookRoutes);
    app.ctx.stderr = "ModuleNotFoundError: x";
    app.ctx.lang = "python";
    const res = await request(app.server)
      .post("/runbooks/match")
      .send({ projectId: "p1" });
    expect(res.status).toBe(200);
    expect(res.body.runbooks[0].id).toBe("python-importerror");
  });

  it("env probe detects variable", async () => {
    process.env.GOOGLE_CLIENT_ID = "abc";
    const app = Fastify();
    app.register(runbookRoutes);
    const res = await request(app.server)
      .post("/runbooks/python-importerror/probe")
      .send({ projectId: "p1" });
    expect(res.body.answers.google_client_id).toBe(true);
  });

  it("synthesizes diff plan", async () => {
    const app = Fastify();
    app.register(runbookRoutes);
    const res = await request(app.server)
      .post("/runbooks/python-importerror/plan")
      .send({ projectId: "p1", answers: { venv: false, module_name: "foo" } });
    expect(res.body.diffs[0].path).toBe("requirements.txt");
    expect(res.body.diffs[0].content).toContain("foo");
  });
});

describe("diff apply", () => {
  it("applies selected hunks only", async () => {
    const app = Fastify();
    app.register(diffRoutes);
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
  });
});
