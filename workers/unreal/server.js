import express from "express";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const app = express();
app.use(express.json());

app.post("/export", async (_req, res) => {
  try {
    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });
    const zipPath = path.join(outDir, "unreal-project.zip");
    await writeFile(zipPath, "stub unreal project");
    res.json({ ok: true, path: zipPath });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unreal exporter listening on", port));
