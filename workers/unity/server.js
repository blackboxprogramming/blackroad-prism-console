import express from "express";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createUnityProjectArchive } from "./template.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/export", async (req, res) => {
  try {
    const { buffer, zipName, fileManifest, metadata } = await createUnityProjectArchive({
      projectName: req.body?.projectName,
      sceneName: req.body?.sceneName,
      summary: req.body?.summary,
      features: Array.isArray(req.body?.features) ? req.body.features : undefined,
    });

    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });
    const zipPath = path.join(outDir, zipName);
    await writeFile(zipPath, buffer);

    res.json({
      ok: true,
      path: zipPath,
      fileName: zipName,
      files: fileManifest,
      metadata,
    });
  } catch (error) {
    console.error("unity exporter failed", error);
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
