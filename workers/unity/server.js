import express from "express";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.join(__dirname, "template");
const downloadsDir = path.join(__dirname, "downloads");

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".json",
  ".unity",
  ".asset",
  ".meta",
  ".md",
  ".yaml",
  ".yml",
]);

function sanitizeName(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const normalized = trimmed.replace(/[^A-Za-z0-9_\- ]+/g, "");
  const withDashes = normalized.replace(/\s+/g, "-");
  return withDashes || fallback;
}

async function ensureTemplateAvailable() {
  try {
    const stats = await stat(templateDir);
    if (!stats.isDirectory()) {
      throw new Error("Unity template directory is not a folder");
    }
  } catch (error) {
    throw new Error(
      `Unity template missing at ${templateDir}: ${error.message || String(error)}`,
    );
  }
}

async function replacePlaceholders(filePath, replacements) {
  const extension = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension)) {
    return;
  }
  const original = await readFile(filePath, "utf8");
  let updated = original;
  for (const [token, value] of Object.entries(replacements)) {
    if (updated.includes(token)) {
      updated = updated.split(token).join(value);
    }
  }
  if (updated !== original) {
    await writeFile(filePath, updated, "utf8");
  }
}

async function walkAndReplace(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndReplace(entryPath, replacements);
    } else if (entry.isFile()) {
      await replacePlaceholders(entryPath, replacements);
    }
  }
}

async function createZipFromTemplate({ projectName, sceneName }) {
  await ensureTemplateAvailable();
  await mkdir(downloadsDir, { recursive: true });

  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "unity-export-"));
  const projectDir = path.join(tmpRoot, projectName);
  const replacements = {
    "{{PROJECT_NAME}}": projectName,
    "{{SCENE_NAME}}": sceneName,
  };

  try {
    await cp(templateDir, projectDir, { recursive: true });
    await walkAndReplace(projectDir, replacements);

    const zipPath = path.join(downloadsDir, `${projectName}.zip`);

    try {
      await execFileAsync("zip", ["-r", zipPath, projectName], { cwd: tmpRoot });
    } catch (error) {
      if (error && error.code === "ENOENT") {
        throw new Error(
          "zip command not found. Install the zip utility to enable Unity package exports.",
        );
      }
      throw error;
    }

    return zipPath;
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
}

app.post("/export", async (req, res) => {
  const { projectName = "BlackRoadPrototype", sceneName = "SampleScene" } = req.body ?? {};
  const safeProjectName = sanitizeName(projectName, "BlackRoadPrototype");
  const safeSceneName = sanitizeName(sceneName, "SampleScene");

  try {
    const zipPath = await createZipFromTemplate({
      projectName: safeProjectName,
      sceneName: safeSceneName,
    });

    res.json({
      ok: true,
      project: safeProjectName,
      scene: safeSceneName,
      path: zipPath,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
