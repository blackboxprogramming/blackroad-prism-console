import express from "express";
import path from "path";
import { exportUnityProject } from "./src/exporter.js";

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
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
