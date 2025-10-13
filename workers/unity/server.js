import express from "express";
import path from "path";
import { mkdir } from "fs/promises";

import {
  buildProjectSpec,
  exportUnityProject,
} from "./projectGenerator.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/export", async (req, res) => {
  try {
    const spec = buildProjectSpec(req.body ?? {});
    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });

    const filename = `${spec.slug}-${Date.now()}.zip`;
    const zipPath = path.join(outDir, filename);
    await exportUnityProject(spec, zipPath);

    res.json({
      ok: true,
      projectName: spec.projectName,
      sceneName: spec.sceneName,
      objects: spec.objects.length,
      path: zipPath,
    });
  } catch (error) {
    const status = error?.statusCode ?? 500;
    res.status(status).json({
      ok: false,
      error: error?.message ?? String(error),
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("unity exporter listening on", port);
});

export default app;
