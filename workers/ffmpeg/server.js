import express from "express";
import { exec } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";

const app = express();
app.use(express.json());

app.post("/render", async (_req, res) => {
  try {
    const outDir = path.join(process.cwd(), "public", "renders");
    await mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, "sample.mp4");
    exec(`ffmpeg -f lavfi -i color=c=black:s=320x240:d=1 -y ${outFile}`, (err) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      res.json({ ok: true, path: outFile });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("ffmpeg worker listening on", port));
