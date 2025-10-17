import { FastifyInstance } from "fastify";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { events } from "./runbooks";

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

      const sanitizedPath = diff.path.replace(/\\/g, "/");
      const normalizedPath = path.posix.normalize(sanitizedPath);

      const isInvalidPath =
        path.posix.isAbsolute(normalizedPath) ||
        normalizedPath === "." ||
        normalizedPath === "" ||
        normalizedPath === ".." ||
        normalizedPath.startsWith("../") ||
        normalizedPath.includes("/../") ||
        normalizedPath.endsWith("/..");

      if (isInvalidPath) {
        throw fastify.httpErrors.badRequest("Invalid diff path");
      }

      const target = path.join(WORK_DIR, normalizedPath);
      const resolvedTarget = path.resolve(target);
      if (
        resolvedTarget !== WORK_DIR &&
        !resolvedTarget.startsWith(WORK_DIR + path.sep)
      ) {
        throw fastify.httpErrors.badRequest("Invalid diff path");
      }

      fs.mkdirSync(path.dirname(resolvedTarget), { recursive: true });
      fs.appendFileSync(resolvedTarget, lines.join("\n") + "\n");
      events.emit("file.write", { path: normalizedPath });
    }
    return { applied: body.diffs.length };
  });
}

export default diffRoutes;
