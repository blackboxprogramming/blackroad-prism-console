import express from "express";
import { cp, mkdtemp, mkdir, readdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, "template");

const DEFAULTS = {
  projectName: "BlackRoad Sample",
  sceneName: "Sample Scene",
  author: "BlackRoad Systems",
  description: "Generated via the BlackRoad Unity exporter."
};

app.post("/export", async (req, res) => {
  const body = req.body ?? {};
  const projectName = extractString(body.projectName, DEFAULTS.projectName);
  const sceneName = extractString(body.sceneName, DEFAULTS.sceneName);
  const author = extractString(body.author, DEFAULTS.author);
  const description = extractString(body.description, DEFAULTS.description);
  const projectSlug = slugify(projectName) || "blackroad-sample";
  const sceneFile = sceneFileName(sceneName);
  const sceneGuid = normalizeGuid(body.sceneGuid) ?? makeGuid();
  const scriptGuid = normalizeGuid(body.scriptGuid) ?? makeGuid();

  const downloadsDir = path.join(process.cwd(), "downloads");
  const tmpRoot = await mkdtemp(path.join(tmpdir(), "unity-exporter-"));
  const projectRoot = path.join(tmpRoot, projectSlug);

  try {
    await cp(TEMPLATE_DIR, projectRoot, { recursive: true });

    if (sceneFile !== "SampleScene") {
      await rename(
        path.join(projectRoot, "Assets", "Scenes", "SampleScene.unity"),
        path.join(projectRoot, "Assets", "Scenes", `${sceneFile}.unity`)
      );
      await rename(
        path.join(projectRoot, "Assets", "Scenes", "SampleScene.unity.meta"),
        path.join(projectRoot, "Assets", "Scenes", `${sceneFile}.unity.meta`)
      );
    }

    const replacements = {
      __PROJECT_NAME__: projectName,
      __SCENE_NAME__: sceneName,
      __SCENE_FILE__: sceneFile,
      __AUTHOR__: author,
      __DESCRIPTION__: description,
      __SCENE_GUID__: sceneGuid,
      __SCRIPT_GUID__: scriptGuid
    };

    await replacePlaceholders(projectRoot, replacements);

    await mkdir(downloadsDir, { recursive: true });
    const zipPath = path.join(downloadsDir, `${projectSlug}.zip`);
    await rm(zipPath, { force: true });
    await zipDirectory(tmpRoot, projectSlug, zipPath);

    res.json({
      ok: true,
      path: zipPath,
      project: {
        name: projectName,
        slug: projectSlug,
        scene: {
          name: sceneName,
          file: `Assets/Scenes/${sceneFile}.unity`,
          guid: sceneGuid
        },
        scriptGuid,
        author,
        description
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("unity exporter listening on", port);
});

function extractString(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sceneFileName(value) {
  const parts = value
    .split(/[^A-Za-z0-9]+/g)
    .filter(Boolean)
    .map(capitalize);
  if (!parts.length) {
    return "SampleScene";
  }
  return parts.join("");
}

function capitalize(segment) {
  if (!segment) {
    return "";
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function normalizeGuid(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  return normalized.length === 32 ? normalized : null;
}

function makeGuid() {
  return randomUUID().replace(/-/g, "").toLowerCase();
}

async function replacePlaceholders(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replacePlaceholders(entryPath, replacements);
      continue;
    }

    let content = await readFile(entryPath, "utf8");
    let updated = content;
    for (const [token, replacement] of Object.entries(replacements)) {
      updated = updated.split(token).join(replacement);
    }
    if (updated !== content) {
      await writeFile(entryPath, updated, "utf8");
    }
  }
}

async function zipDirectory(root, folderName, destination) {
  await new Promise((resolve, reject) => {
    const zip = spawn("zip", ["-r", destination, folderName], { cwd: root });
    zip.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`zip exited with code ${code}`));
      }
    });
    zip.on("error", reject);
  });
}
