import express from "express";
import archiver from "archiver";
import { mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import crypto from "crypto";
import { buildUnityTemplate } from "./template.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const archiveTemplate = async ({ files, slug }) => {
  const outDir = path.join(process.cwd(), "downloads");
  await mkdir(outDir, { recursive: true });
  const fileName = `${slug}-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")}.zip`;
  const zipPath = path.join(outDir, fileName);

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    files.forEach((file) => {
      archive.append(file.content, { name: file.path });
    });
    archive.finalize();
  });

  return { zipPath, fileName };
};

app.post("/export", async (req, res) => {
  try {
    const template = buildUnityTemplate(req.body ?? {});
    const { zipPath, fileName } = await archiveTemplate({
      files: template.files,
      slug: template.slug,
    });

    res.json({
      ok: true,
      output: zipPath,
      fileName,
      projectName: template.projectName,
      sceneName: template.sceneName,
      files: template.files.map((file) => file.path),
    });
  } catch (error) {
    console.error("Failed to export Unity project", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
