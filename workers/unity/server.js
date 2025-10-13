import express from "express";
import { execFile } from "child_process";
import { mkdir, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const app = express();
app.use(express.json({ limit: "1mb" }));

const DEFAULT_DEPENDENCIES = {
  "com.unity.ide.rider": "3.0.29",
  "com.unity.ide.visualstudio": "2.0.22",
  "com.unity.ide.vscode": "1.2.5",
  "com.unity.render-pipelines.universal": "14.0.11",
  "com.unity.test-framework": "1.1.33",
  "com.unity.textmeshpro": "3.0.6",
  "com.unity.timeline": "1.7.5",
};

const DEFAULT_SCENES = [
  {
    name: "SampleScene",
    description: "Starter sandbox scene",
  },
];

app.post("/export", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res
      .status(400)
      .json({ ok: false, error: "Request body must be a JSON object." });
  }

  let workspaceDir;
  try {
    const {
      projectName = "UnityPrototype",
      unityVersion = "2022.3.40f1",
      companyName = "BlackRoad",
      productName,
      scenes,
      packages,
    } = req.body;

    const safeProjectName = sanitiseIdentifier(projectName) || "UnityPrototype";
    const unityVersionString = String(unityVersion).trim() || "2022.3.40f1";
    const company = normaliseText(companyName, "BlackRoad");
    const product = normaliseText(productName, safeProjectName);

    const normalisedScenes = buildScenes(scenes);
    const { dependencies, requestedPackages } = buildDependencies(packages);

    const downloadsDir = path.join(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });

    const workspaceName = `${safeProjectName}-${Date.now().toString(36)}`;
    workspaceDir = path.join(downloadsDir, workspaceName);

    await Promise.all([
      mkdir(workspaceDir, { recursive: true }),
      mkdir(path.join(workspaceDir, "Assets", "Scenes"), { recursive: true }),
      mkdir(path.join(workspaceDir, "Packages"), { recursive: true }),
      mkdir(path.join(workspaceDir, "ProjectSettings"), { recursive: true }),
    ]);

    const sceneEntries = await writeScenes(workspaceDir, normalisedScenes);

    await Promise.all([
      writeFile(
        path.join(workspaceDir, "Packages", "manifest.json"),
        createManifest(dependencies),
        "utf8",
      ),
      writeFile(
        path.join(workspaceDir, "ProjectSettings", "ProjectVersion.txt"),
        createProjectVersion(unityVersionString),
        "utf8",
      ),
      writeFile(
        path.join(workspaceDir, "ProjectSettings", "EditorBuildSettings.asset"),
        createEditorBuildSettings(sceneEntries),
        "utf8",
      ),
      writeFile(
        path.join(workspaceDir, "ProjectSettings", "ProjectSettings.asset"),
        createProjectSettings({ company, product }),
        "utf8",
      ),
      writeFile(
        path.join(workspaceDir, "README.md"),
        createReadme({
          projectName: safeProjectName,
          companyName: company,
          productName: product,
          unityVersion: unityVersionString,
          scenes: normalisedScenes,
          packages: dependencies,
        }),
        "utf8",
      ),
    ]);

    const zipName = `${workspaceName}.zip`;
    const zipPath = path.join(downloadsDir, zipName);

    await execFileAsync("zip", ["-qr", zipPath, "."], {
      cwd: workspaceDir,
    });

    const zipStat = await stat(zipPath);

    await rm(workspaceDir, { recursive: true, force: true });

    res.json({
      ok: true,
      project: {
        name: safeProjectName,
        unityVersion: unityVersionString,
        companyName: company,
        productName: product,
      },
      scenes: sceneEntries,
      packages: dependencies,
      requestedPackages,
      archive: {
        path: path.relative(process.cwd(), zipPath),
        sizeBytes: zipStat.size,
      },
      notes:
        "Import the archive into Unity Hub or unzip into your Unity projects folder.",
    });
  } catch (error) {
    if (workspaceDir) {
      await rm(workspaceDir, { recursive: true, force: true }).catch(() => {});
    }
    res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));

function sanitiseIdentifier(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normaliseText(value, fallback) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function buildScenes(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return DEFAULT_SCENES.map((scene) => ({ ...scene }));
  }

  const scenes = input.map((scene, index) => {
    if (typeof scene === "string") {
      return {
        name: scene,
        description: "Generated from request payload",
      };
    }

    if (scene && typeof scene === "object") {
      const name = normaliseText(scene.name, `Scene${index + 1}`);
      return {
        name,
        description: normaliseText(
          scene.description,
          "Generated from request payload",
        ),
        enabled: scene.enabled !== false,
      };
    }

    return {
      name: `Scene${index + 1}`,
      description: "Generated from request payload",
    };
  });

  const hasEnabled = scenes.some((scene) => scene.enabled !== false);
  if (!hasEnabled && scenes.length > 0) {
    scenes[0].enabled = true;
  }

  return scenes.map((scene, index) => {
    const fileName = sanitiseIdentifier(scene.name) || `Scene${index + 1}`;
    return {
      name: scene.name,
      description: scene.description,
      enabled: scene.enabled !== false,
      fileName,
    };
  });
}

function buildDependencies(input) {
  const dependencies = { ...DEFAULT_DEPENDENCIES };
  const requestedPackages = [];

  if (!Array.isArray(input)) {
    return { dependencies, requestedPackages };
  }

  input.forEach((entry) => {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (!name) {
        return;
      }
      dependencies[name] = dependencies[name] || "latest";
      requestedPackages.push({ name, version: dependencies[name] });
      return;
    }

    if (entry && typeof entry === "object") {
      const name = normaliseText(entry.name, "");
      if (!name) {
        return;
      }
      const version = normaliseText(entry.version, "latest");
      dependencies[name] = version;
      requestedPackages.push({ name, version });
    }
  });

  return { dependencies, requestedPackages };
}

async function writeScenes(workspaceDir, scenes) {
  const sceneEntries = [];

  await Promise.all(
    scenes.map(async (scene, index) => {
      const sceneFileName = `${scene.fileName}.unity`;
      const scenePath = path.join(
        workspaceDir,
        "Assets",
        "Scenes",
        sceneFileName,
      );

      await writeFile(
        scenePath,
        createSceneTemplate(scene.name, scene.description),
        "utf8",
      );

      sceneEntries.push({
        name: scene.name,
        path: `Assets/Scenes/${sceneFileName}`,
        enabled: scene.enabled !== false,
      });
    }),
  );

  return sceneEntries.sort((a, b) => a.name.localeCompare(b.name));
}

function createManifest(dependencies) {
  return `${JSON.stringify(
    {
      manifestVersion: 2,
      dependencies,
      registry: "https://packages.unity.com",
    },
    null,
    2,
  )}\n`;
}

function createProjectVersion(unityVersion) {
  return `m_EditorVersion: ${unityVersion}\nm_EditorVersionWithRevision: ${unityVersion} (stub)\n`;
}

function createEditorBuildSettings(sceneEntries) {
  const sceneLines = sceneEntries
    .map(
      (scene) => `    - enabled: ${scene.enabled ? 1 : 0}\n      path: ${scene.path}\n      guid: 00000000000000000000000000000000`,
    )
    .join("\n");

  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1045 &1\nEditorBuildSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 2\n  m_Scenes:\n${sceneLines || "    []"}\n`;
}

function createProjectSettings({ company, product }) {
  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!129 &1\nPlayerSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 24\n  productGUID: 00000000000000000000000000000000\n  AndroidProfiler: 0\n  companyName: ${company}\n  productName: ${product}\n  defaultScreenWidth: 1920\n  defaultScreenHeight: 1080\n  runInBackground: 1\n`;
}

function createSceneTemplate(sceneName, description) {
  return `// ${sceneName}\n// ${description}\n%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1 &1\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Name: ${sceneName}\n  m_TagString: Untagged\n  m_Component:\n  - component: {fileID: 4}\n  m_Layer: 0\n  m_IsActive: 1\n--- !u!4 &4\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1}\n  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n  m_LocalPosition: {x: 0, y: 0, z: 0}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n  m_Children: []\n`;
}

function createReadme({
  projectName,
  companyName,
  productName,
  unityVersion,
  scenes,
  packages,
}) {
  const sceneList = scenes
    .map((scene) => `- ${scene.name}${scene.enabled === false ? " (disabled)" : ""}`)
    .join("\n");

  const packageList = Object.entries(packages)
    .map(([name, version]) => `- ${name}: ${version}`)
    .join("\n");

  return `# ${projectName}\n\n- Company: ${companyName}\n- Product: ${productName}\n- Unity Version: ${unityVersion}\n\n## Scenes\n\n${sceneList || "(none)"}\n\n## Packages\n\n${packageList || "(none)"}\n\n## Getting Started\n\n1. Open Unity Hub and click **Add project from disk**.\n2. Select the extracted folder from this archive.\n3. When prompted, ensure Unity ${unityVersion} (or newer) is installed.\n\nThis starter layout was generated automatically by the BlackRoad Unity exporter.\n`;
}
