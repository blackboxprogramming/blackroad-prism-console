import express from "express";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "1mb" }));

const DEFAULT_PACKAGES = {
  "com.unity.collab-proxy": "2.0.6",
  "com.unity.inputsystem": "1.7.0",
  "com.unity.textmeshpro": "3.0.6",
};

const DOWNLOADS_ROOT = path.join(process.cwd(), "downloads", "unity");

class ExportError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ExportError";
    this.status = status;
  }
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\-_.\s]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unity-project";

const normalizeScenes = (input) => {
  const source =
    typeof input === "string"
      ? [input]
      : Array.isArray(input)
      ? input
      : [];
  const candidates = source.length > 0 ? source : ["MainScene"];
  const seen = new Set();

  return candidates
    .map((scene, index) =>
      typeof scene === "string" ? scene.trim() : `Scene${index + 1}`
    )
    .filter(Boolean)
    .map((scene, index) => {
      const sanitized = scene.replace(/[^a-z0-9_\-\s]/gi, "");
      const base = sanitized.replace(/\s+/g, "");
      const fallback = base || `Scene${index + 1}`;
      let fileName = fallback;
      let counter = 1;
      while (seen.has(fileName.toLowerCase())) {
        counter += 1;
        fileName = `${fallback}${counter}`;
      }
      seen.add(fileName.toLowerCase());
      return {
        displayName: scene,
        fileName,
      };
    });
};

const parsePackages = (input) => {
  if (!input) {
    return {};
  }

  if (Array.isArray(input)) {
    return input.reduce((acc, value) => {
      if (typeof value === "string") {
        const [name, version] = value.split("@");
        if (name && version) {
          acc[name.trim()] = version.trim();
        }
      } else if (value && typeof value === "object") {
        const { name, version } = value;
        if (typeof name === "string" && typeof version === "string") {
          acc[name.trim()] = version.trim();
        }
      }
      return acc;
    }, {});
  }

  if (typeof input === "object") {
    return Object.entries(input).reduce((acc, [name, version]) => {
      if (typeof version === "string" && version.trim()) {
        acc[name.trim()] = version.trim();
      }
      return acc;
    }, {});
  }

  return {};
};

const buildReadme = ({ projectName, description, scenes, packages }) => {
  const sceneLines = scenes
    .map((scene, index) => `- ${index + 1}. ${scene.displayName}`)
    .join("\n");

  const packageLines = Object.entries(packages)
    .map(([name, version]) => `- ${name}@${version}`)
    .join("\n");

  return `# ${projectName}\n\n` +
    `${description ? `${description}\n\n` : ""}` +
    `## Scenes\n${sceneLines || "- MainScene"}\n\n` +
    `## Packages\n${packageLines || "- com.unity.collab-proxy@2.0.6"}\n\n` +
    `## Next Steps\n` +
    `1. Open the project in Unity 2022.3 LTS (or newer).\n` +
    `2. Review \`BlackRoad/export.json\` for metadata captured during export.\n` +
    `3. Replace placeholder scenes in \`Assets/Scenes\` with real gameplay content.\n` +
    `4. Update \`Documentation/notes.md\` with design decisions and iteration history.\n`;
};

const buildScenePlaceholder = (scene, index) => {
  const baseId = 100000 + index * 100;
  const gameObjectId = baseId + 1;
  const transformId = baseId + 2;
  return `%YAML 1.1\n` +
    `%TAG !u! tag:unity3d.com,2011:\n` +
    `--- !u!1 &${gameObjectId}\n` +
    `GameObject:\n` +
    `  m_ObjectHideFlags: 0\n` +
    `  m_Name: ${scene.displayName}\n` +
    `  m_Component:\n` +
    `  - component: {fileID: ${transformId}}\n` +
    `  m_TransformParent: {fileID: 0}\n` +
    `  m_Layer: 0\n` +
    `  m_TagString: Untagged\n` +
    `  m_IsActive: 1\n` +
    `--- !u!4 &${transformId}\n` +
    `Transform:\n` +
    `  m_ObjectHideFlags: 0\n` +
    `  m_GameObject: {fileID: ${gameObjectId}}\n` +
    `  m_LocalScale: {x: 1, y: 1, z: 1}\n` +
    `  m_LocalPosition: {x: 0, y: 0, z: 0}\n` +
    `  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n` +
    `  m_Father: {fileID: 0}\n` +
    `  m_RootOrder: 0\n` +
    `  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}\n`;
};

const buildEditorBuildSettings = (scenes) => {
  const sceneEntries = scenes
    .map(
      (scene) =>
        `  - enabled: 1\n` +
        `    path: Assets/Scenes/${scene.fileName}.unity\n` +
        `    guid: 00000000000000000000000000000000`
    )
    .join("\n");

  return `%YAML 1.1\n` +
    `%TAG !u! tag:unity3d.com,2011:\n` +
    `--- !u!1045 &1\n` +
    `EditorBuildSettings:\n` +
    `  m_ObjectHideFlags: 0\n` +
    `  serializedVersion: 2\n` +
    `  m_Scenes:\n${sceneEntries || "    - enabled: 1\n      path: Assets/Scenes/MainScene.unity\n      guid: 00000000000000000000000000000000"}\n` +
    `  m_configObjects: {}\n`;
};

const buildProjectSettings = (projectName) =>
  `%YAML 1.1\n` +
  `%TAG !u! tag:unity3d.com,2011:\n` +
  `--- !u!129 &1\n` +
  `PlayerSettings:\n` +
  `  productName: ${projectName}\n` +
  `  companyName: BlackRoad\n` +
  `  defaultScreenWidth: 1920\n` +
  `  defaultScreenHeight: 1080\n` +
  `  runInBackground: 1\n` +
  `  fullscreenMode: 1\n` +
  `  displayResolutionDialog: 0\n` +
  `  bundleVersion: 0.1.0\n` +
  `  defaultInterfaceOrientation: 3\n` +
  `  allowedAutorotateToPortrait: 1\n` +
  `  allowedAutorotateToPortraitUpsideDown: 1\n` +
  `  allowedAutorotateToLandscapeRight: 1\n` +
  `  allowedAutorotateToLandscapeLeft: 1\n` +
  `  usePlayerLog: 1\n` +
  `  resizableWindow: 1\n` +
  `  metalAPIValidation: 0\n` +
  `  useMacAppStoreValidation: 0\n`;

const manifestJson = (packages) =>
  JSON.stringify(
    {
      dependencies: packages,
      scopedRegistries: [
        {
          name: "BlackRoad",
          url: "https://packages.blackroad.dev",
          scopes: ["com.blackroad"],
        },
      ],
    },
    null,
    2
  );

const ensureDirectory = async (dir) => {
  await mkdir(dir, { recursive: true });
};

export const exportUnityProject = async (options = {}) => {
  const {
    projectName = "BlackRoadPrototype",
    description = "Autogenerated Unity scaffolding for rapid iteration.",
    author,
    scenes,
    notes,
    packages,
  } = options;

  if (typeof projectName !== "string" || !projectName.trim()) {
    throw new ExportError("projectName must be a non-empty string", 400);
  }

  const normalizedScenes = normalizeScenes(scenes);
  const packageOverrides = parsePackages(packages);
  const manifestPackages = { ...DEFAULT_PACKAGES, ...packageOverrides };

  await ensureDirectory(DOWNLOADS_ROOT);

  const slug = slugify(projectName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const zipFileName = `${slug}-${timestamp}.zip`;
  const zipPath = path.join(DOWNLOADS_ROOT, zipFileName);

  const metadata = {
    projectName,
    slug,
    description,
    author: author || "Unknown",
    createdAt: new Date().toISOString(),
    scenes: normalizedScenes.map((scene) => ({
      name: scene.displayName,
      file: `Assets/Scenes/${scene.fileName}.unity`,
    })),
    packages: manifestPackages,
  };

  let bytesWritten = 0;

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      bytesWritten = archive.pointer();
      resolve();
    });
    output.on("error", reject);

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("archive warning", err);
      } else {
        reject(err);
      }
    });

    archive.on("error", reject);

    archive.pipe(output);

    const projectRoot = `${slug}/`;

    archive.append(buildReadme({ projectName, description, scenes: normalizedScenes, packages: manifestPackages }), {
      name: `${projectRoot}README.md`,
    });

    archive.append(JSON.stringify(metadata, null, 2), {
      name: `${projectRoot}BlackRoad/export.json`,
    });

    archive.append(notes ? `${notes}\n` : "Placeholder for design notes.\n", {
      name: `${projectRoot}Documentation/notes.md`,
    });

    archive.append(manifestJson(manifestPackages), {
      name: `${projectRoot}Packages/manifest.json`,
    });

    archive.append(buildProjectSettings(projectName), {
      name: `${projectRoot}ProjectSettings/ProjectSettings.asset`,
    });

    archive.append("m_EditorVersion: 2022.3.9f1\nm_EditorVersionWithRevision: 2022.3.9f1 (000000000000)\n", {
      name: `${projectRoot}ProjectSettings/ProjectVersion.txt`,
    });

    archive.append(buildEditorBuildSettings(normalizedScenes), {
      name: `${projectRoot}ProjectSettings/EditorBuildSettings.asset`,
    });

    normalizedScenes.forEach((scene, index) => {
      archive.append(buildScenePlaceholder(scene, index), {
        name: `${projectRoot}Assets/Scenes/${scene.fileName}.unity`,
      });
    });

    archive.append(
      "# Placeholder for core gameplay scripts\n// Add your C# MonoBehaviour scripts here.\n",
      {
        name: `${projectRoot}Assets/Scripts/README.md`,
      }
    );

    archive.finalize();
  });

  return {
    ok: true,
    path: zipPath,
    fileName: zipFileName,
    bytesWritten,
    project: metadata,
  };
};

app.post("/export", async (req, res) => {
  try {
    const result = await exportUnityProject(req.body ?? {});
    res.json(result);
  } catch (error) {
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    res.status(status).json({ ok: false, error: error?.message || "Unknown export error" });
  }
});

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] === modulePath) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log("unity exporter listening on", port));
}

export { app };
export default app;
