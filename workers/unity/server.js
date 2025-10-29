import express from "express";
import path from "path";
import { exportUnityProject } from "./src/exporter.js";
import { mkdir, writeFile } from "fs/promises";
import { execFile } from "child_process";
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile
} from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
import archiver from "archiver";
import { mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import archiver from "archiver";
import crypto from "crypto";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { buildUnityTemplate } from "./template.js";
import {
  mkdir,
  mkdtemp,
  rename,
  rm,
  writeFile,
} from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { ZipFile } from "yazl";

const DEFAULT_EDITOR_VERSION = "2022.3.0f1";
const DEFAULT_PROJECT_NAME = "BlackRoadUnitySample";
const DEFAULT_SCENE_NAME = "SampleScene";

const app = express();
app.use(express.json({ limit: "2mb" }));

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
const DEFAULT_PROJECT_NAME = "BlackRoadUnitySample";
const DEFAULT_SCENE_NAME = "SampleScene";
const DEFAULT_SCRIPT_NAME = "HelloBlackRoad";

function createDefaultScript(scriptName) {
  return `using UnityEngine;

public class ${scriptName} : MonoBehaviour
{
    void Start()
    {
        Debug.Log("BlackRoad Unity exporter generated project ready!");
    }
}
`;
}

const DEFAULT_SCENE = `# BlackRoad Unity Scene Placeholder
# Open in Unity and add objects to build out your world.
`;

const PROJECT_VERSION = `m_EditorVersion: 2022.3.15f1
m_EditorVersionWithRevision: 2022.3.15f1 (bce4550a1dad)
`;

const PACKAGE_MANIFEST = JSON.stringify(
  {
    dependencies: {
      "com.unity.collab-proxy": "1.17.7",
      "com.unity.ide.rider": "3.0.21",
      "com.unity.ide.visualstudio": "2.0.22",
      "com.unity.ide.vscode": "1.2.5",
      "com.unity.test-framework": "1.1.33",
      "com.unity.textmeshpro": "3.0.6",
      "com.unity.timeline": "1.7.4",
      "com.unity.ugui": "1.0.0",
      "com.unity.modules.ai": "1.0.0",
      "com.unity.modules.animation": "1.0.0",
      "com.unity.modules.audio": "1.0.0",
      "com.unity.modules.imgui": "1.0.0",
      "com.unity.modules.physics": "1.0.0",
      "com.unity.modules.physics2d": "1.0.0",
      "com.unity.modules.tilemap": "1.0.0",
      "com.unity.modules.ui": "1.0.0",
      "com.unity.modules.unitywebrequest": "1.0.0"
    }
  },
  null,
  2
);

function sanitizeFolderName(name, fallback) {
  const normalized =
    (name ?? "")
      .toString()
      .trim()
      .replace(/[^A-Za-z0-9-_]+/g, "-") || fallback;
  return normalized.length ? normalized : fallback;
}

function sanitizeIdentifier(name, fallback) {
  const normalized =
    (name ?? "")
      .toString()
      .trim()
      .replace(/[^A-Za-z0-9_]+/g, "") || fallback;
  return normalized.length ? normalized : fallback;
}

async function createUnityTemplate(projectRoot, options) {
  const {
    projectName,
    sceneName,
    scriptName,
    scriptContents,
    sceneContents
  } = options;

  const assetsDir = path.join(projectRoot, "Assets");
  const scriptsDir = path.join(assetsDir, "Scripts");
  const scenesDir = path.join(assetsDir, "Scenes");
  const packagesDir = path.join(projectRoot, "Packages");
  const settingsDir = path.join(projectRoot, "ProjectSettings");

  await Promise.all([
    mkdir(scriptsDir, { recursive: true }),
    mkdir(scenesDir, { recursive: true }),
    mkdir(packagesDir, { recursive: true }),
    mkdir(settingsDir, { recursive: true })
  ]);

  const scriptFile = path.join(scriptsDir, `${scriptName}.cs`);
  const sceneFile = path.join(scenesDir, `${sceneName}.unity`);
  const packageManifest = path.join(packagesDir, "manifest.json");
  const projectVersion = path.join(settingsDir, "ProjectVersion.txt");
  const projectReadme = path.join(projectRoot, "README.md");

  await Promise.all([
    writeFile(
      scriptFile,
      scriptContents ?? createDefaultScript(scriptName),
      "utf8"
    ),
    writeFile(sceneFile, sceneContents ?? DEFAULT_SCENE, "utf8"),
    writeFile(packageManifest, PACKAGE_MANIFEST, "utf8"),
    writeFile(projectVersion, PROJECT_VERSION, "utf8"),
    writeFile(
      projectReadme,
      `# ${projectName}\n\nGenerated by the BlackRoad Unity exporter.\n`,
      "utf8"
    )
  ]);
}

app.post("/export", async (req, res) => {
  const body = req.body ?? {};

  const projectName = sanitizeFolderName(
    body.projectName,
    DEFAULT_PROJECT_NAME
  );
  const sceneName = sanitizeFolderName(body.sceneName, DEFAULT_SCENE_NAME);
  const scriptName = sanitizeIdentifier(
    body.scriptName,
    DEFAULT_SCRIPT_NAME
  );

  const outDir = path.join(process.cwd(), "downloads");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveName = `${projectName}-${timestamp}.zip`;
  const zipPath = path.join(outDir, archiveName);

  let tempRoot;
  try {
    await mkdir(outDir, { recursive: true });

    tempRoot = await mkdtemp(path.join(os.tmpdir(), "unity-exporter-"));
    const projectRoot = path.join(tempRoot, projectName);
    await mkdir(projectRoot, { recursive: true });

    await createUnityTemplate(projectRoot, {
      projectName,
      sceneName,
      scriptName,
      scriptContents: body.scriptContents,
      sceneContents: body.sceneContents
    });

    await rm(zipPath, { force: true });
    await execFileAsync("zip", ["-r", zipPath, projectName], {
      cwd: tempRoot
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
app.use(express.json({ limit: "1mb" }));

const DEFAULT_SCENES = [
  {
    name: "SampleScene",
    description: "Starter layout with a rotating cube and directional light.",
    camera: {
      position: { x: 0, y: 1.2, z: -4 },
      rotation: { x: 10, y: 0, z: 0 },
    },
    rotationSpeed: 30,
  },
];

const sanitizeForPath = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const sanitized = trimmed.replace(/[^A-Za-z0-9_-]+/g, "_");
  return sanitized || fallback;
};

const makeGuid = () => crypto.randomUUID().replace(/-/g, "").toLowerCase();

const DEG2RAD = Math.PI / 180;
const eulerToQuaternion = ({ x = 0, y = 0, z = 0 }) => {
  const halfX = (x * DEG2RAD) / 2;
  const halfY = (y * DEG2RAD) / 2;
  const halfZ = (z * DEG2RAD) / 2;

  const sinX = Math.sin(halfX);
  const cosX = Math.cos(halfX);
  const sinY = Math.sin(halfY);
  const cosY = Math.cos(halfY);
  const sinZ = Math.sin(halfZ);
  const cosZ = Math.cos(halfZ);

  const quaternion = {
    x: sinX * cosY * cosZ + cosX * sinY * sinZ,
    y: cosX * sinY * cosZ - sinX * cosY * sinZ,
    z: cosX * cosY * sinZ + sinX * sinY * cosZ,
    w: cosX * cosY * cosZ - sinX * sinY * sinZ,
  };

  const magnitude = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w) || 1;

  return {
    x: quaternion.x / magnitude,
    y: quaternion.y / magnitude,
    z: quaternion.z / magnitude,
    w: quaternion.w / magnitude,
  };
};

const ensureScenes = (scenes) => {
  const candidates = Array.isArray(scenes) ? scenes : [];
  const normalized = candidates
    .map((scene, index) => {
      if (!scene || typeof scene !== "object") {
        return null;
      }
      const rawName =
        typeof scene.name === "string" && scene.name.trim()
          ? scene.name.trim()
          : `Scene${index + 1}`;
      const fileName = `${sanitizeForPath(rawName, `Scene${index + 1}`)}.unity`;
      const guid =
        typeof scene.guid === "string" && /^[a-f0-9]{32}$/i.test(scene.guid)
          ? scene.guid.toLowerCase()
          : makeGuid();
      return {
        name: rawName,
        fileName,
        guid,
        description:
          typeof scene.description === "string" && scene.description.trim()
            ? scene.description.trim()
            : "Generated scene stub created by the BlackRoad Unity exporter.",
        camera: {
          position: {
            x: Number(scene?.camera?.position?.x ?? 0),
            y: Number(scene?.camera?.position?.y ?? 1),
            z: Number(scene?.camera?.position?.z ?? -10),
          },
          rotation: {
            x: Number(scene?.camera?.rotation?.x ?? 0),
            y: Number(scene?.camera?.rotation?.y ?? 0),
            z: Number(scene?.camera?.rotation?.z ?? 0),
          },
        },
        rotationSpeed: Number.isFinite(scene?.rotationSpeed)
          ? Number(scene.rotationSpeed)
          : 45,
      };
    })
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  return DEFAULT_SCENES.map((scene, index) => ({
    ...scene,
    fileName: `${sanitizeForPath(scene.name, `Scene${index + 1}`)}.unity`,
    guid: makeGuid(),
  }));
};

const renderSceneUnity = (scene, bootstrapGuid) => {
  const { position, rotation } = scene.camera;
  const quaternion = eulerToQuaternion(rotation);
  return `// ${scene.name}.unity\n// ${scene.description}\n%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1 &1000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Name: Main Camera\n  m_Component:\n  - component: {fileID: 1001}\n  - component: {fileID: 1002}\n  - component: {fileID: 1003}\n  m_Transform: {fileID: 1004}\n--- !u!20 &1001\nCamera:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n  field of view: 60\n  m_FocalLength: 50\n  near clip plane: 0.3\n  far clip plane: 1000\n--- !u!81 &1002\nAudioListener:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n--- !u!92 &1003\nBehaviour:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n--- !u!4 &1004\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n  m_LocalPosition: {x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}}\n  m_LocalRotation: {x: ${quaternion.x.toFixed(6)}, y: ${quaternion.y.toFixed(6)}, z: ${quaternion.z.toFixed(6)}, w: ${quaternion.w.toFixed(6)}}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n--- !u!1 &2000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Name: Scene Bootstrap\n  m_Component:\n  - component: {fileID: 2001}\n  m_Transform: {fileID: 2002}\n--- !u!4 &2002\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 2000}\n  m_LocalPosition: {x: 0, y: 0, z: 0}\n  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n--- !u!114 &2001\nMonoBehaviour:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 2000}\n  m_Script: {fileID: 11500000, guid: ${bootstrapGuid}, type: 3}\n  m_Name: SceneBootstrap\n  m_EditorClassIdentifier: \n  sceneLabel: ${scene.name}\n  sceneDescription: ${scene.description}\n  rotationSpeed: ${scene.rotationSpeed}\n`;
};

const renderSceneMeta = (guid) => `fileFormatVersion: 2\nguid: ${guid}\nSceneImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n`;

const renderBootstrapScript = () => `using UnityEngine;\n\npublic class Bootstrap : MonoBehaviour\n{\n    [SerializeField]\n    private string sceneLabel = \"Generated Scene\";\n\n    [SerializeField, TextArea(2, 6)]\n    private string sceneDescription = \"\";\n\n    [SerializeField]\n    private float rotationSpeed = 45f;\n\n    private GameObject demoCube;\n\n    private void Start()\n    {\n        Debug.Log($\"[BlackRoad] Loaded scene '{sceneLabel}' - {sceneDescription}\");\n\n        demoCube = GameObject.CreatePrimitive(PrimitiveType.Cube);\n        demoCube.name = \"BlackRoadDemoCube\";\n        demoCube.transform.position = new Vector3(0f, 0.5f, 0f);\n        var material = new Material(Shader.Find(\"Universal Render Pipeline/Lit\"));\n        material.color = new Color(0.2f, 0.6f, 0.9f);\n        var renderer = demoCube.GetComponent<Renderer>();\n        if (renderer != null)\n        {\n            renderer.material = material;\n        }\n    }\n\n    private void Update()\n    {\n        if (demoCube == null)\n        {\n            return;\n        }\n\n        demoCube.transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime, Space.World);\n    }\n}\n`;

const renderBootstrapMeta = (guid) => `fileFormatVersion: 2\nguid: ${guid}\nMonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n`;

const renderPackagesManifest = () =>
  `${JSON.stringify(
    {
      dependencies: {
        "com.unity.collab-proxy": "2.0.5",
        "com.unity.ide.visualstudio": "2.0.22",
        "com.unity.ide.vscode": "1.2.5",
        "com.unity.render-pipelines.universal": "14.0.8",
        "com.unity.test-framework": "1.3.6",
        "com.unity.textmeshpro": "3.0.6",
        "com.unity.timeline": "1.7.6",
        "com.unity.ugui": "1.0.0",
        "com.unity.modules.ai": "1.0.0",
        "com.unity.modules.animation": "1.0.0",
        "com.unity.modules.audio": "1.0.0",
        "com.unity.modules.physics": "1.0.0",
        "com.unity.modules.physics2d": "1.0.0",
        "com.unity.modules.particlesystem": "1.0.0",
        "com.unity.modules.ui": "1.0.0",
        "com.unity.modules.unitywebrequest": "1.0.0",
      },
    },
    null,
    2
  )}\n`;

const renderEditorBuildSettings = (scenes) => {
  const sceneLines = scenes
    .map(
      (scene) =>
        `  - enabled: 1\n    path: Assets/Scenes/${scene.fileName}\n    guid: ${scene.guid}`
    )
    .join("\n");

  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1045 &1\nEditorBuildSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 2\n  m_Scenes:\n${sceneLines}\n  m_configObjects: {}\n`;
};

const renderProjectVersion = () => `m_EditorVersion: 2022.3.21f1\nm_EditorVersionWithRevision: 2022.3.21f1 (b1234567890ab)\n`;

const renderReadme = (projectName, description, scenes, generatedAt) => {
  const sceneList = scenes
    .map((scene) => `- ${scene.name} → Assets/Scenes/${scene.fileName}`)
    .join("\n");

  return `# ${projectName}\n\n${description || "Unity project exported via the BlackRoad pipeline."}\n\n## Scenes\n${sceneList}\n\nGenerated at ${generatedAt}.\n`;
};

app.post("/export", async (req, res) => {
  const { projectName = "BlackRoadUnityPrototype", description = "", scenes } = req.body ?? {};
  const normalizedScenes = ensureScenes(scenes);
  const generatedAt = new Date().toISOString();
  const outDir = path.join(process.cwd(), "downloads");
  const safeFolderName = sanitizeForPath(projectName, "BlackRoadUnityProject");
  const timestamp = generatedAt.replace(/[:.]/g, "-");
  const zipFileName = `${safeFolderName}-${timestamp}.zip`;
  const zipPath = path.join(outDir, zipFileName);
  const bootstrapGuid = makeGuid();

  try {
    await mkdir(outDir, { recursive: true });
    const archive = archiver("zip", { zlib: { level: 9 } });
    const output = createWriteStream(zipPath);
    archive.pipe(output);

    const projectMetadata = {
      name: projectName,
      description,
      generatedAt,
      scenes: normalizedScenes,
    };

    archive.append(renderPackagesManifest(), {
      name: `${safeFolderName}/Packages/manifest.json`,
    });
    archive.append(renderProjectVersion(), {
      name: `${safeFolderName}/ProjectSettings/ProjectVersion.txt`,
    });
    archive.append(renderEditorBuildSettings(normalizedScenes), {
      name: `${safeFolderName}/ProjectSettings/EditorBuildSettings.asset`,
    });

    const bootstrapScriptPath = `${safeFolderName}/Assets/Scripts/Bootstrap.cs`;
    archive.append(renderBootstrapScript(), { name: bootstrapScriptPath });
    archive.append(renderBootstrapMeta(bootstrapGuid), {
      name: `${bootstrapScriptPath}.meta`,
    });

    normalizedScenes.forEach((scene) => {
      archive.append(renderSceneUnity(scene, bootstrapGuid), {
        name: `${safeFolderName}/Assets/Scenes/${scene.fileName}`,
      });
      archive.append(renderSceneMeta(scene.guid), {
        name: `${safeFolderName}/Assets/Scenes/${scene.fileName}.meta`,
      });
    });

    archive.append(JSON.stringify(projectMetadata, null, 2) + "\n", {
      name: `${safeFolderName}/blackroad_export.json`,
    });
    archive.append(renderReadme(projectName, description, normalizedScenes, generatedAt), {
      name: `${safeFolderName}/README.md`,
    });

    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);
      archive.finalize();
    });
const DEFAULT_PROJECT_NAME = "BlackRoadUnity";
const DEFAULT_DESCRIPTION =
  "Starter Unity project generated by the BlackRoad exporter.";
const DEFAULT_SCENES = ["SampleScene"];
const UNITY_VERSION = "2022.3.36f1";
const UNITY_VERSION_WITH_REVISION = `${UNITY_VERSION} (000000000000)`;

const sanitizeProjectName = (name) => {
  if (typeof name !== "string") return DEFAULT_PROJECT_NAME;
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_PROJECT_NAME;
  const normalized = trimmed
    .replace(/[^A-Za-z0-9-_\s]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized ? normalized.slice(0, 64) : DEFAULT_PROJECT_NAME;
};

const sanitizeSceneName = (name) => {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/[^A-Za-z0-9-_\s]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || null;
};

const normalizeScenes = (scenes) => {
  if (scenes === undefined) return DEFAULT_SCENES;
  if (!Array.isArray(scenes)) return null;
  const deduped = new Set();
  for (const entry of scenes) {
    let candidate = entry;
    if (entry && typeof entry === "object" && typeof entry.name === "string") {
      candidate = entry.name;
    }
    const sanitized = sanitizeSceneName(candidate);
    if (sanitized) {
      deduped.add(sanitized);
    }
  }
  return deduped.size > 0 ? Array.from(deduped) : DEFAULT_SCENES;
};

const projectReadme = (projectName, description, scenes) => {
  const sceneList = scenes.map((scene) => `- Assets/Scenes/${scene}.unity`).join("\n");
  return `# ${projectName}\n\n${description}\n\n## Included Scenes\n${sceneList}\n\nGenerated on ${new Date().toISOString()} by the Unity exporter service.`;
};

const manifestJson = `{
  "dependencies": {
    "com.unity.collab-proxy": "2.0.5",
    "com.unity.ide.rider": "3.0.24",
    "com.unity.ide.visualstudio": "2.0.22",
    "com.unity.test-framework": "1.3.9",
    "com.unity.textmeshpro": "3.0.6",
    "com.unity.timeline": "1.7.5",
    "com.unity.ugui": "1.0.0",
    "com.unity.visualscripting": "1.9.4"
  }
}`;

const projectVersionFile = () =>
  `m_EditorVersion: ${UNITY_VERSION}\nm_EditorVersionWithRevision: ${UNITY_VERSION_WITH_REVISION}\n`; // newline at end of file expected by Unity

const editorBuildSettings = (scenes) => {
  const sceneEntries = scenes
    .map(
      (scene) => `  - enabled: 1\n    path: Assets/Scenes/${scene}.unity\n    guid: ${randomUUID().replace(/-/g, "")}`,
    )
    .join("\n");
  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1045 &1\nEditorBuildSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 2\n  m_Scenes:\n${sceneEntries}\n  m_configObjects: {}\n`;
};

const defaultSceneContent = (scene) => `// ${scene}.unity\n// Placeholder scene generated by the BlackRoad Unity exporter.\n// Open this project in Unity to replace it with a real scene.\n`;

app.post("/export", async (req, res) => {
  const {
    projectName: requestedProjectName,
    description = DEFAULT_DESCRIPTION,
    scenes: requestedScenes,
  } = req.body ?? {};

  const projectName = sanitizeProjectName(requestedProjectName);
  const scenes = normalizeScenes(requestedScenes);

  if (!scenes) {
    res
      .status(400)
      .json({ ok: false, error: "`scenes` must be an array of names or { name } objects." });
    return;
  }

  let stagingRoot;
  try {
    const downloadsDir = path.join(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });

    stagingRoot = await mkdtemp(path.join(tmpdir(), "unity-export-"));
    const projectRoot = path.join(stagingRoot, projectName);
    await mkdir(projectRoot, { recursive: true });

    const createdFiles = [];
    const writeRelativeFile = async (relativePath, contents) => {
      const targetPath = path.join(projectRoot, relativePath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, contents, "utf8");
      createdFiles.push(relativePath.replace(/\\/g, "/"));
    };

    await writeRelativeFile("README.md", projectReadme(projectName, description, scenes));
    await writeRelativeFile("Packages/manifest.json", `${manifestJson}\n`);
    await writeRelativeFile("ProjectSettings/ProjectVersion.txt", projectVersionFile());
    await writeRelativeFile(
      "ProjectSettings/EditorBuildSettings.asset",
      editorBuildSettings(scenes),
    );
    await writeRelativeFile(
      "Assets/Scripts/README.md",
      `# Scripts\n\nAdd your gameplay scripts in this folder.\n\nGenerated scenes:\n${scenes
        .map((scene) => `- ${scene}`)
        .join("\n")}\n`,
    );

    for (const scene of scenes) {
      await writeRelativeFile(`Assets/Scenes/${scene}.unity`, defaultSceneContent(scene));
    }

    const zipTempDir = stagingRoot;
    const zipTempPath = path.join(zipTempDir, `${projectName}.zip`);
    const zipTargetPath = path.join(
      downloadsDir,
      `${projectName}-${Date.now().toString(36)}.zip`,
    );

    try {
      await execFileAsync("zip", ["-r", zipTempPath, projectName], {
        cwd: zipTempDir,
      });
    } catch (error) {
      const stderr = error?.stderr?.toString() ?? "";
      throw new Error(`Failed to create zip archive: ${error.message || error}. ${stderr}`);
    }

    await rename(zipTempPath, zipTargetPath);

    res.json({
      ok: true,
      projectName,
      sceneName,
      scriptName,
      path: zipPath
    });
  } catch (error) {
    console.error("unity exporter error", error);
    res.status(500).json({ ok: false, error: String(error) });
  } finally {
    if (tempRoot) {
      try {
        await rm(tempRoot, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("failed to clean up temp directory", cleanupError);
      }
    }
      output: zipPath,
      fileName,
      projectName: template.projectName,
      sceneName: template.sceneName,
      files: template.files.map((file) => file.path),
    });
  } catch (error) {
    console.error("Failed to export Unity project", error);
      path: zipPath,
      fileName: zipFileName,
      project: projectMetadata,
    });
  } catch (error) {
    console.error("Unity exporter failed", error);
    res.status(500).json({ ok: false, error: String(error) });
  writeFile,
  rm,
  stat
} from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

class ExportError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/export", async (req, res) => {
  try {
    const { projectName, scenes, description } = req.body ?? {};
    const safeProjectName = sanitizeProjectName(projectName);
    const safeScenes = normalizeScenes(scenes);
    const exportInfo = await createUnityProject({
      projectName: safeProjectName,
      scenes: safeScenes,
      description: typeof description === "string" ? description.trim() : undefined
    });
    res.json({
      ok: true,
      ...exportInfo
    });
  } catch (error) {
    const status = error instanceof ExportError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Unity export failed", error);
    res.status(status).json({ ok: false, error: message });
import path from "path";
import { mkdir } from "fs/promises";

import {
  buildProjectSpec,
  exportUnityProject,
} from "./projectGenerator.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/export", async (req, res) => {
  try {
    const spec = buildProjectSpec(req.body ?? {});
    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });

    const filename = `${spec.slug}-${Date.now()}.zip`;
    const zipPath = path.join(outDir, filename);
    await exportUnityProject(spec, zipPath);

    res.json({
      ok: true,
      projectName: spec.projectName,
      sceneName: spec.sceneName,
      objects: spec.objects.length,
      path: zipPath,
    });
  } catch (error) {
    const status = error?.statusCode ?? 500;
    res.status(status).json({
      ok: false,
      error: error?.message ?? String(error),
    });
      path: zipTargetPath,
      files: createdFiles.sort(),
    });
  } catch (error) {
    console.error("Unity export failed", error);
    res.status(500).json({ ok: false, error: error?.message || String(error) });
  } finally {
    if (stagingRoot) {
      try {
        await rm(stagingRoot, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("Failed to clean up staging directory", cleanupError);
      }
    }
  try {
    const {
      projectName: rawProjectName,
      sceneName: rawSceneName,
      description,
    } = req.body ?? {};

    const projectName = sanitizeName(rawProjectName, DEFAULT_PROJECT_NAME);
    const sceneName = sanitizeName(rawSceneName, DEFAULT_SCENE_NAME);

    const downloadsDir = path.join(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });

    const zipPath = path.join(
      downloadsDir,
      `${projectName}-${Date.now()}.zip`,
    );

    await createUnityProjectZip({
      projectName,
      sceneName,
      description,
      zipPath,
    });

    res.json({
      ok: true,
      path: zipPath,
      projectName,
      sceneName,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));

function sanitizeProjectName(name) {
  if (typeof name !== "string") {
    return "BlackRoadUnityProject";
  }
  const cleaned = name
    .trim()
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return cleaned ? cleaned.slice(0, 64) : "BlackRoadUnityProject";
}

function normalizeScenes(input) {
  if (input === undefined) {
    return ["MainScene"];
  }
  if (!Array.isArray(input)) {
    throw new ExportError("`scenes` must be an array of names", 400);
  }
  const sanitized = input
    .map((scene) => (typeof scene === "string" ? scene : ""))
    .map((scene) =>
      scene
        .trim()
        .replace(/[^A-Za-z0-9 _-]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^[_-]+|[_-]+$/g, "")
    )
    .filter(Boolean);
  const uniqueScenes = Array.from(new Set(sanitized)).slice(0, 20);
  return uniqueScenes.length > 0 ? uniqueScenes : ["MainScene"];
}

async function createUnityProject({ projectName, scenes, description }) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "unity-export-"));
  const projectRoot = path.join(tempRoot, projectName);
  const scenesDir = path.join(projectRoot, "Assets", "Scenes");
  const projectSettingsDir = path.join(projectRoot, "ProjectSettings");
  const packagesDir = path.join(projectRoot, "Packages");

  try {
    await mkdir(scenesDir, { recursive: true });
    await mkdir(projectSettingsDir, { recursive: true });
    await mkdir(packagesDir, { recursive: true });

    await Promise.all([
      writeReadme(projectRoot, projectName, description),
      writeBuildSettings(projectSettingsDir, scenes),
      writeProjectVersion(projectSettingsDir),
      writeProjectSettings(projectSettingsDir),
      writeManifest(packagesDir)
    ]);

    await Promise.all(
      scenes.map((sceneName, index) =>
        writeScene(path.join(scenesDir, `${sceneName}.unity`), sceneName, index)
      )
    );

    const downloadsDir = path.join(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });
    const zipPath = path.join(
      downloadsDir,
      `${projectName}-${Date.now()}.zip`
    );

    try {
      await execFileAsync("zip", ["-rq", zipPath, projectName], {
        cwd: tempRoot
      });
    } catch (error) {
      throw new ExportError(
        "Failed to bundle Unity project. Ensure the `zip` utility is available.",
        500
      );
    }

    const fileStats = await stat(zipPath);
    return {
      path: zipPath,
      projectName,
      scenes,
      size: fileStats.size,
      createdAt: new Date().toISOString()
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function writeReadme(projectRoot, projectName, description) {
  const contents = [`# ${projectName}`, "", description?.trim() || "Unity project scaffold generated by BlackRoad.", "", "## Getting Started", "1. Open the project in Unity 2022.3 LTS or newer.", "2. Review the generated scenes under `Assets/Scenes`.", "3. Update project settings and packages to match your team's standards."].join("\n");
  await writeFile(path.join(projectRoot, "README.md"), contents, "utf8");
}

async function writeBuildSettings(projectSettingsDir, scenes) {
  const entries = scenes
    .map(
      (scene) =>
        "  - enabled: 1\n" +
        `    path: Assets/Scenes/${scene}.unity\n` +
        "    guid: 00000000000000000000000000000000"
    )
    .join("\n");
  const contents =
    "%YAML 1.1\n" +
    "%TAG !u! tag:unity3d.com,2011:\n" +
    "--- !u!1045 &1\n" +
    "EditorBuildSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "  serializedVersion: 2\n" +
    "  m_Scenes:\n" +
    entries +
    "\n  m_configObjects: {}\n";
  await writeFile(
    path.join(projectSettingsDir, "EditorBuildSettings.asset"),
    contents,
    "utf8"
  );
}

async function writeProjectVersion(projectSettingsDir) {
  const contents = [
    "m_EditorVersion: 2022.3.21f1",
    "m_EditorVersionWithRevision: 2022.3.21f1 (revision 6c5b472a2d91)"
  ].join("\n");
  await writeFile(
    path.join(projectSettingsDir, "ProjectVersion.txt"),
    contents,
    "utf8"
  );
}

async function writeProjectSettings(projectSettingsDir) {
  const contents =
    "%YAML 1.1\n" +
    "%TAG !u! tag:unity3d.com,2011:\n" +
    "--- !u!129 &1\n" +
    "PlayerSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "  serializedVersion: 23\n" +
    "  productName: BlackRoad Prototype\n" +
    "  companyName: BlackRoad Labs\n" +
    "  defaultScreenWidth: 1920\n" +
    "  defaultScreenHeight: 1080\n" +
    "  fullscreenMode: 1\n" +
    "  defaultScreenOrientation: 4\n" +
    "  displayResolutionDialog: 1\n" +
    "  targetDevice: 2\n" +
    "  usePlayerLog: 1\n" +
    "  forceSingleInstance: 0\n" +
    "  resizableWindow: 1\n" +
    "  useMacAppStoreValidation: 0\n" +
    "  protectGraphicsMemory: 0\n" +
    "  visibleInBackground: 1\n" +
    "  allowFullscreenSwitch: 1\n" +
    "  runInBackground: 1\n" +
    "  captureSingleScreen: 0\n";
  await writeFile(
    path.join(projectSettingsDir, "ProjectSettings.asset"),
    contents,
    "utf8"
  );
}

async function writeManifest(packagesDir) {
  const manifest = {
    dependencies: {
      "com.unity.collab-proxy": "1.17.7",
      "com.unity.ide.rider": "3.0.24",
      "com.unity.ide.visualstudio": "2.0.22",
      "com.unity.ide.vscode": "1.2.5",
      "com.unity.render-pipelines.universal": "14.0.10",
      "com.unity.test-framework": "1.3.9",
      "com.unity.textmeshpro": "3.0.6",
      "com.unity.timeline": "1.7.5",
      "com.unity.ugui": "1.0.0",
      "com.unity.modules.ai": "1.0.0",
      "com.unity.modules.animation": "1.0.0",
      "com.unity.modules.audio": "1.0.0",
      "com.unity.modules.director": "1.0.0",
      "com.unity.modules.imageconversion": "1.0.0",
      "com.unity.modules.jsonserialize": "1.0.0",
      "com.unity.modules.particlesystem": "1.0.0",
      "com.unity.modules.physics": "1.0.0",
      "com.unity.modules.physics2d": "1.0.0",
      "com.unity.modules.tilemap": "1.0.0",
      "com.unity.modules.ui": "1.0.0",
      "com.unity.modules.uielements": "1.0.0",
      "com.unity.modules.unitywebrequest": "1.0.0",
      "com.unity.modules.video": "1.0.0"
    }
  };
  await writeFile(
    path.join(packagesDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

async function writeScene(scenePath, sceneName, index) {
  const contents =
    "%YAML 1.1\n" +
    "%TAG !u! tag:unity3d.com,2011:\n" +
    "--- !u!29 &1\n" +
    "SceneSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "--- !u!104 &2\n" +
    "RenderSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "--- !u!157 &3\n" +
    "LightmapSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "--- !u!196 &4\n" +
    "NavMeshSettings:\n" +
    "  m_ObjectHideFlags: 0\n" +
    "--- !u!1 &1000\n" +
    "GameObject:\n" +
    `  m_Name: ${sceneName}\n` +
    "  m_Component:\n" +
    "  - component: {fileID: 2000}\n" +
    "  m_Layer: 0\n" +
    "  m_IsActive: 1\n" +
    "--- !u!4 &2000\n" +
    "Transform:\n" +
    "  m_GameObject: {fileID: 1000}\n" +
    "  m_LocalPosition: {x: 0, y: 0, z: 0}\n" +
    "  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n" +
    "  m_LocalScale: {x: 1, y: 1, z: 1}\n" +
    `  m_RootOrder: ${index}\n` +
    "  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}\n";
  await writeFile(scenePath, contents, "utf8");
}
app.listen(port, () => {
  console.log("unity exporter listening on", port);
});

export default app;
function sanitizeName(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const cleaned = trimmed
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

async function createUnityProjectZip({
  projectName,
  sceneName,
  description,
  zipPath,
}) {
  await new Promise((resolve, reject) => {
    const zip = new ZipFile();
    const output = createWriteStream(zipPath);
    zip.outputStream
      .pipe(output)
      .on("close", resolve)
      .on("error", reject);

    const root = `${projectName}/`;
    const sceneFolder = `${root}Assets/Scenes/`;
    const scriptsFolder = `${root}Assets/Scripts/`;
    const projectSettingsFolder = `${root}ProjectSettings/`;
    const packagesFolder = `${root}Packages/`;

    zip.addEmptyDirectory(root);
    zip.addEmptyDirectory(sceneFolder);
    zip.addEmptyDirectory(scriptsFolder);
    zip.addEmptyDirectory(projectSettingsFolder);
    zip.addEmptyDirectory(packagesFolder);

    addTextFile(
      zip,
      `${root}README.md`,
      buildReadme(projectName, sceneName, description),
    );

    addTextFile(zip, `${scriptsFolder}BlackRoadBootstrap.cs`, buildBootstrapScript(description));

    addTextFile(
      zip,
      `${sceneFolder}${sceneName}.unity`,
      buildSampleScene(sceneName),
    );

    addTextFile(
      zip,
      `${projectSettingsFolder}ProjectVersion.txt`,
      `m_EditorVersion: ${DEFAULT_EDITOR_VERSION}\n` +
        `m_EditorVersionWithRevision: ${DEFAULT_EDITOR_VERSION} (000000000000)\n`,
    );

    addTextFile(
      zip,
      `${projectSettingsFolder}EditorBuildSettings.asset`,
      buildEditorBuildSettings(sceneName),
    );

    addTextFile(
      zip,
      `${packagesFolder}manifest.json`,
      buildManifest(),
    );

    addTextFile(
      zip,
      `${packagesFolder}packages-lock.json`,
      buildPackagesLock(),
    );

    zip.end();
  });
}

function addTextFile(zip, filePath, contents) {
  zip.addBuffer(Buffer.from(contents, "utf8"), filePath);
}

function buildReadme(projectName, sceneName, description) {
  const desc = description?.trim();
  const sections = [
    `# ${projectName}`,
    "",
    "This archive was generated by the BlackRoad Unity exporter worker.",
    "",
    `- **Default scene:** \`Assets/Scenes/${sceneName}.unity\``,
    "- **Bootstrap script:** `Assets/Scripts/BlackRoadBootstrap.cs`",
  ];

  if (desc) {
    sections.push("", "## Scenario", "", desc);
  }

  sections.push(
    "",
    "## Getting Started",
    "",
    "1. Open the project folder in Unity (2022.3 or newer recommended).",
    `2. Open the \`${sceneName}.unity\` scene from the \`Assets/Scenes\` folder.`,
    "3. Enter Play Mode to see the bootstrap behaviour logging to the Console.",
    "",
    "You can now extend the project with additional assets, scripts, and scenes.",
  );

  return sections.join("\n");
}

function buildBootstrapScript(description) {
  const message = (description?.trim() || "Welcome to the BlackRoad prototype scene.").replace(/\r?\n\s*/g, " ").trim();
  const literal = JSON.stringify(message);
  return `using UnityEngine;\n\npublic class BlackRoadBootstrap : MonoBehaviour\n{\n    [SerializeField]\n    private string message = ${literal};\n\n    private void Start()\n    {\n        Debug.Log($"[BlackRoadBootstrap] {message}");\n    }\n}\n`;
}

function buildSampleScene(sceneName) {
  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!29 &1\nSceneAsset:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_Name: ${sceneName}\n  serializedVersion: 0\n  m_MasterSceneGuid: 00000000000000000000000000000000\n--- !u!104 &2\nRenderSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 9\n  m_Fog: 0\n  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}\n  m_FogMode: 3\n  m_FogDensity: 0.01\n  m_LinearFogStart: 0\n  m_LinearFogEnd: 300\n  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}\n  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}\n  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}\n  m_AmbientIntensity: 1\n  m_AmbientMode: 0\n  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}\n  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}\n  m_HaloStrength: 0.5\n  m_FlareStrength: 1\n  m_FlareFadeSpeed: 3\n  m_HaloTexture: {fileID: 0}\n  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}\n  m_DefaultReflectionMode: 0\n  m_DefaultReflectionResolution: 128\n  m_ReflectionBounces: 1\n  m_ReflectionIntensity: 1\n  m_CustomReflection: {fileID: 0}\n  m_Sun: {fileID: 0}\n  m_IndirectSpecularColor: {r: 0.44657898, g: 0.4964133, b: 0.5748178, a: 1}\n  m_UseRadianceAmbientProbe: 0\n--- !u!157 &3\nLightmapSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 12\n  m_GIWorkflowMode: 0\n  m_GISettings:\n    serializedVersion: 2\n    m_BounceScale: 1\n    m_IndirectOutputScale: 1\n    m_AlbedoBoost: 1\n    m_EnvironmentLightingMode: 0\n    m_EnableBakedLightmaps: 1\n    m_EnableRealtimeLightmaps: 0\n  m_LightmapEditorSettings:\n    serializedVersion: 12\n    m_Resolution: 2\n    m_BakeResolution: 40\n    m_AtlasSize: 1024\n    m_AO: 0\n    m_AOMaxDistance: 1\n    m_CompAOExponent: 1\n    m_CompAOExponentDirect: 0\n    m_ExtractAmbientOcclusion: 0\n    m_Padding: 2\n    m_LightmapParameters: {fileID: 0}\n    m_LightmapsBakeMode: 1\n    m_TextureCompression: 1\n    m_FinalGather: 0\n    m_FinalGatherFiltering: 1\n    m_FinalGatherRayCount: 256\n    m_ReflectionCompression: 2\n    m_MixedBakeMode: 2\n    m_BakeBackend: 1\n    m_PVRSampling: 1\n    m_PVRDirectSampleCount: 32\n    m_PVRSampleCount: 500\n    m_PVRBounces: 2\n    m_PVREnvironmentSampleCount: 256\n    m_PVREnvironmentReferencePointCount: 2048\n    m_PVRFilteringMode: 2\n    m_PVRDenoiserTypeDirect: 1\n    m_PVRDenoiserTypeIndirect: 1\n    m_PVRDenoiserTypeAO: 1\n    m_PVRFilterTypeDirect: 0\n    m_PVRFilterTypeIndirect: 0\n    m_PVRFilterTypeAO: 0\n    m_PVREnvironmentMIS: 0\n    m_PVRCulling: 1\n    m_PVRFilteringGaussRadiusDirect: 1\n    m_PVRFilteringGaussRadiusIndirect: 5\n    m_PVRFilteringGaussRadiusAO: 2\n    m_PVRFilteringAtrousPositionSigmaDirect: 0.5\n    m_PVRFilteringAtrousPositionSigmaIndirect: 2\n    m_PVRFilteringAtrousPositionSigmaAO: 1\n    m_ExportTrainingData: 0\n    m_TrainingDataDestination: \"\"\n    m_LightProbeSampleCountMultiplier: 1\n  m_LightingDataAsset: {fileID: 0}\n  m_LightingSettings: {fileID: 0}\n--- !u!196 &4\nNavMeshSettings:\n  serializedVersion: 2\n  m_ObjectHideFlags: 0\n  m_BuildSettings:\n    serializedVersion: 2\n    agentTypeID: 0\n    agentRadius: 0.5\n    agentHeight: 2\n    agentSlope: 45\n    agentClimb: 0.4\n    ledgeDropHeight: 0\n    maxJumpAcrossDistance: 0\n    minRegionArea: 2\n    manualCellSize: 0\n    cellSize: 0.16666667\n    manualTileSize: 0\n    tileSize: 256\n    accuratePlacement: 0\n    maxJobWorkers: 0\n    preserveTilesOutsideBounds: 0\n    debug: 0\n  m_NavMeshData: {fileID: 0}\n--- !u!1 &1000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  serializedVersion: 6\n  m_Component:\n  - component: {fileID: 1001}\n  - component: {fileID: 1002}\n  m_Layer: 0\n  m_Name: Main Camera\n  m_TagString: MainCamera\n  m_Icon: {fileID: 0}\n  m_NavMeshLayer: 0\n  m_StaticEditorFlags: 0\n  m_IsActive: 1\n--- !u!4 &1001\nTransform:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: 1000}\n  serializedVersion: 2\n  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n  m_LocalPosition: {x: 0, y: 1, z: -10}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n  m_ConstrainProportionsScale: 0\n  m_Children: []\n  m_Father: {fileID: 0}\n  m_RootOrder: 0\n  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}\n--- !u!20 &1002\nCamera:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: 1000}\n  m_Enabled: 1\n  serializedVersion: 2\n  m_ClearFlags: 1\n  m_BackGroundColor: {r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 0}\n  m_projectionMatrixMode: 1\n  m_GateFitMode: 2\n  m_FOVAxisMode: 0\n  m_SensorSize: {x: 36, y: 24}\n  m_LensShift: {x: 0, y: 0}\n  m_FocalLength: 50\n  m_NormalizedViewPortRect:\n    serializedVersion: 2\n    x: 0\n    y: 0\n    width: 1\n    height: 1\n  near clip plane: 0.3\n  far clip plane: 1000\n  field of view: 60\n  orthographic: 0\n  orthographic size: 5\n  m_Depth: -1\n  m_CullingMask:\n    serializedVersion: 2\n    m_Bits: 4294967295\n  m_RenderingPath: -1\n  m_TargetTexture: {fileID: 0}\n  m_TargetDisplay: 0\n  m_TargetEye: 3\n  m_HDR: 1\n  m_AllowMSAA: 1\n  m_AllowDynamicResolution: 0\n  m_ForceIntoRT: 0\n  m_OcclusionCulling: 1\n  m_StereoConvergence: 10\n  m_StereoSeparation: 0.022\n--- !u!1 &2000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  serializedVersion: 6\n  m_Component:\n  - component: {fileID: 2001}\n  - component: {fileID: 2002}\n  - component: {fileID: 2003}\n  m_Layer: 0\n  m_Name: Directional Light\n  m_TagString: Untagged\n  m_Icon: {fileID: 0}\n  m_NavMeshLayer: 0\n  m_StaticEditorFlags: 0\n  m_IsActive: 1\n--- !u!4 &2001\nTransform:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: 2000}\n  serializedVersion: 2\n  m_LocalRotation: {x: 0.40821788, y: -0.23456968, z: 0.10938163, w: 0.8754261}\n  m_LocalPosition: {x: 0, y: 3, z: 0}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n  m_ConstrainProportionsScale: 0\n  m_Children: []\n  m_Father: {fileID: 0}\n  m_RootOrder: 1\n  m_LocalEulerAnglesHint: {x: 50, y: -30, z: 0}\n--- !u!108 &2002\nLight:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: 2000}\n  m_Enabled: 1\n  serializedVersion: 10\n  m_Type: 1\n  m_Shape: 0\n  m_Color: {r: 1, g: 0.95686275, b: 0.8392157, a: 1}\n  m_Intensity: 1\n  m_Range: 10\n  m_SpotAngle: 30\n  m_InnerSpotAngle: 21.80208\n  m_CookieSize: 10\n  m_Shadows:\n    m_Type: 2\n    m_Resolution: -1\n    m_CustomResolution: -1\n    m_Strength: 1\n    m_Bias: 0.05\n    m_NormalBias: 0.4\n    m_NearPlane: 0.2\n  m_Cookie: {fileID: 0}\n  m_DrawHalo: 0\n  m_Flare: {fileID: 0}\n  m_RenderMode: 0\n  m_CullingMask:\n    serializedVersion: 2\n    m_Bits: 4294967295\n  m_Lightmapping: 4\n  m_LightShadowCasterMode: 0\n  m_AreaSize: {x: 1, y: 1}\n  m_BounceIntensity: 1\n  m_ColorTemperature: 6570\n  m_UseColorTemperature: 0\n  m_BoundingSphereOverride: {x: 0, y: 0, z: 0, w: 0}\n  m_UseBoundingSphereOverride: 0\n  m_ShadowRadius: 0\n  m_ShadowAngle: 0\n--- !u!114 &2003\nMonoBehaviour:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: 2000}\n  m_Enabled: 1\n  m_EditorHideFlags: 0\n  m_Script: {fileID: 11500000, guid: 0000000000000000e000000000000000, type: 0}\n  m_Name: \"\"\n  m_EditorClassIdentifier: \"\"\n  message: Welcome to the BlackRoad prototype scene.\n`;
}

function buildEditorBuildSettings(sceneName) {
  return `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1045 &1\nEditorBuildSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 2\n  m_Scenes:\n  - enabled: 1\n    path: Assets/Scenes/${sceneName}.unity\n    guid: 00000000000000000000000000000000\n  m_configObjects: { }\n`;
}

function buildManifest() {
  return `{
  "dependencies": {
    "com.unity.ai.navigation": "1.1.5",
    "com.unity.cinemachine": "2.9.7",
    "com.unity.collab-proxy": "2.0.5",
    "com.unity.inputsystem": "1.7.0",
    "com.unity.test-framework": "1.1.33",
    "com.unity.textmeshpro": "3.0.6",
    "com.unity.timeline": "1.8.6",
    "com.unity.visualscripting": "1.9.5",
    "com.unity.modules.ai": "1.0.0",
    "com.unity.modules.androidjni": "1.0.0",
    "com.unity.modules.animation": "1.0.0",
    "com.unity.modules.assetbundle": "1.0.0",
    "com.unity.modules.audio": "1.0.0",
    "com.unity.modules.cloth": "1.0.0",
    "com.unity.modules.director": "1.0.0",
    "com.unity.modules.imageconversion": "1.0.0",
    "com.unity.modules.imgui": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0",
    "com.unity.modules.particlesystem": "1.0.0",
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0",
    "com.unity.modules.screencapture": "1.0.0",
    "com.unity.modules.terrain": "1.0.0",
    "com.unity.modules.terrainphysics": "1.0.0",
    "com.unity.modules.tilemap": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.uielements": "1.0.0",
    "com.unity.modules.umbra": "1.0.0",
    "com.unity.modules.unityanalytics": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.modules.unitywebrequestassetbundle": "1.0.0",
    "com.unity.modules.unitywebrequestaudio": "1.0.0",
    "com.unity.modules.unitywebrequesttexture": "1.0.0",
    "com.unity.modules.unitywebrequestwww": "1.0.0",
    "com.unity.modules.vehicles": "1.0.0",
    "com.unity.modules.video": "1.0.0",
    "com.unity.modules.vr": "1.0.0",
    "com.unity.modules.wind": "1.0.0",
    "com.unity.modules.xr": "1.0.0"
  }
}
`;
}

function buildPackagesLock() {
  return `{
  "dependencies": {
    "com.unity.ai.navigation": {
      "version": "1.1.5",
      "depth": 0,
      "source": "registry",
      "dependencies": {
        "com.unity.mathematics": "1.2.6"
      }
    },
    "com.unity.cinemachine": {
      "version": "2.9.7",
      "depth": 0,
      "source": "registry",
      "dependencies": {
        "com.unity.modules.animation": "1.0.0"
      }
    }
  }
}
`;
}
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
