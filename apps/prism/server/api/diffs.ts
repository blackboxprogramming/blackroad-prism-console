import { FastifyInstance } from "fastify";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { publishEvent } from "../events/bus";

const WORK_DIR = path.resolve(process.cwd(), "prism/work");

export async function diffRoutes(fastify: FastifyInstance) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fastify.post("/diffs/apply", async (req) => {
    const body = z
      .object({
        diffs: z.array(
          z.object({
            path: z.string(),
            hunks: z.array(z.string()),
          })
        ),
        selection: z.record(z.array(z.number())).optional(),
      })
      .parse(req.body);
    for (const diff of body.diffs) {
      const selected = body.selection?.[diff.path] ?? diff.hunks.map((_, i) => i);
      const lines = diff.hunks.filter((_, i) => selected.includes(i));
      const target = path.join(WORK_DIR, diff.path);
      fs.appendFileSync(target, lines.join("\n") + "\n");
      await publishEvent(
        "actions.file.write",
        { path: diff.path },
        { actor: "kindest-coder" }
      );
    }
    return { applied: body.diffs.length };
  });
}

export default diffRoutes;
