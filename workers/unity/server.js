import express from "express";
import path from "path";
import { exportUnityProject } from "./src/exporter.js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const app = express();
app.use(express.json());

app.post("/export", async (req, res) => {
  try {
    const result = await exportUnityProject({
      ...req.body,
      outputDir: path.join(process.cwd(), "downloads"),
    });
    res.json({
      ok: true,
      path: result.zipPath,
      projectFolder: result.projectFolder,
      bytes: result.bytes,
      files: result.files,
      metadata: result.metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
app.post("/export", async (_req, res) => {
  try {
    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });
    const zipPath = path.join(outDir, "unity-project.zip");
    await writeFile(zipPath, "stub unity project");
    res.json({ ok: true, path: zipPath });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
