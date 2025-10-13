import express from "express";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, "template");
const DEFAULT_PROJECT_NAME = "BlackRoadUnityProject";
const DEFAULT_SCENE_NAME = "MainScene";
const TEXT_EXTENSIONS = new Set([
  ".asset",
  ".cs",
  ".json",
  ".md",
  ".meta",
  ".txt",
  ".unity",
]);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/export", async (req, res) => {
  const projectName = sanitizeName(req.body?.projectName, DEFAULT_PROJECT_NAME);
  const sceneName = sanitizeName(req.body?.sceneName, DEFAULT_SCENE_NAME);
  const replacements = {
    "__PROJECT_NAME__": projectName,
    "__SCENE_NAME__": sceneName,
  };

  let tmpRoot;
  try {
    await ensureTemplate();

    tmpRoot = await mkdtemp(path.join(os.tmpdir(), "unity-export-"));
    const projectDir = path.join(tmpRoot, projectName);
    await mkdir(projectDir, { recursive: true });
    await cp(TEMPLATE_DIR, projectDir, { recursive: true });

    await replaceTokens(projectDir, replacements);
    await renamePlaceholders(projectDir, replacements);

    const downloadsDir = path.join(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });
    const archiveName = `${slugify(projectName)}.zip`;
    const zipPath = path.join(downloadsDir, archiveName);
    await rm(zipPath, { force: true });

    await execFileAsync("zip", ["-r", zipPath, projectName], { cwd: tmpRoot });

    res.json({
      ok: true,
      path: zipPath,
      projectName,
      sceneName,
      archiveName,
    });
  } catch (error) {
    console.error("Unity export failed", error);
    res.status(500).json({ ok: false, error: String(error) });
  } finally {
    if (tmpRoot) {
      await rm(tmpRoot, { recursive: true, force: true }).catch(() => undefined);
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));

function sanitizeName(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim().slice(0, 64);
  const sanitized = trimmed.replace(/[^A-Za-z0-9 _-]/g, "");
  return sanitized.length > 0 ? sanitized : fallback;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "unity-project";
}

async function ensureTemplate() {
  try {
    await stat(TEMPLATE_DIR);
  } catch (error) {
    throw new Error(`Unity template missing at ${TEMPLATE_DIR}`);
  }
}

async function replaceTokens(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(fullPath, replacements);
      continue;
    }

    if (!isTextFile(entry.name)) {
      continue;
    }

    const original = await readFile(fullPath, "utf8");
    const updated = applyReplacements(original, replacements);
    if (updated !== original) {
      await writeFile(fullPath, updated, "utf8");
    }
  }
}

async function renamePlaceholders(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const oldPath = path.join(dir, entry.name);
    const newName = applyReplacements(entry.name, replacements);
    const targetPath = newName !== entry.name ? path.join(dir, newName) : oldPath;

    if (newName !== entry.name) {
      await rename(oldPath, targetPath);
    }

    if (entry.isDirectory()) {
      await renamePlaceholders(targetPath, replacements);
    }
  }
}

function applyReplacements(value, replacements) {
  let output = value;
  for (const [token, replacement] of Object.entries(replacements)) {
    output = output.split(token).join(replacement);
  }
  return output;
}

function isTextFile(filename) {
  return TEXT_EXTENSIONS.has(path.extname(filename).toLowerCase());
}
