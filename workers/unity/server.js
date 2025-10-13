import express from "express";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import archiver from "archiver";
import path from "path";

const app = express();
app.use(express.json());

const DEFAULT_PROJECT_NAME = "SampleUnityProject";
const DEFAULT_SCENE_NAME = "SampleScene";
const DEFAULT_SCRIPT_NAME = "OrbitingCube";

const projectFilesTemplate = ({ projectName, sceneName, scriptName }) => ({
  "README.md": `# ${projectName}\n\nThis archive contains a ready-to-open Unity project scaffold.\n\n## Quick start\n1. Unzip the archive.\n2. Open the folder with Unity Hub (recommended Unity 2022.3 LTS or newer).\n3. Open **Assets/Scenes/${sceneName}.unity** and press Play.\n\nThe scene contains an empty stage with a rotating cube behaviour defined in \`Assets/Scripts/${scriptName}.cs\`.\n`,
  "ProjectSettings/ProjectVersion.txt": "m_EditorVersion: 2022.3.22f1\n",
  "ProjectSettings/ProjectSettings.asset": `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!129 &1\nPlayerSettings:\n  m_ObjectHideFlags: 0\n  serializedVersion: 24\n  companyName: BlackRoad\n  productName: ${projectName}\n  defaultScreenWidth: 1920\n  defaultScreenHeight: 1080\n  m_DefaultScreenOrientation: 4\n  fullscreenMode: 1\n`,
  "Packages/manifest.json":
    JSON.stringify(
      {
        dependencies: {
          "com.unity.collab-proxy": "2.0.5",
          "com.unity.ide.rider": "3.0.28",
          "com.unity.ide.visualstudio": "2.0.22",
          "com.unity.ide.vscode": "1.2.5",
          "com.unity.render-pipelines.universal": "14.0.11",
          "com.unity.test-framework": "1.3.9",
          "com.unity.textmeshpro": "3.0.6",
          "com.unity.timeline": "1.8.6",
          "com.unity.ugui": "1.0.0",
          "com.unity.modules.ai": "1.0.0",
          "com.unity.modules.animation": "1.0.0",
          "com.unity.modules.audio": "1.0.0",
          "com.unity.modules.imgui": "1.0.0",
          "com.unity.modules.jsonserialize": "1.0.0",
          "com.unity.modules.physics": "1.0.0",
          "com.unity.modules.physics2d": "1.0.0",
          "com.unity.modules.ui": "1.0.0",
        },
      },
      null,
      2,
    ) + "\n",
  "Packages/packages-lock.json":
    JSON.stringify(
      {
        dependencies: {
          "com.unity.render-pipelines.universal": {
            version: "14.0.11",
            depth: 0,
            source: "registry",
            dependencies: {
              "com.unity.render-pipelines.core": "14.0.11",
              "com.unity.shadergraph": "14.0.11",
            },
          },
        },
      },
      null,
      2,
    ) + "\n",
  [`Assets/Scenes/${sceneName}.unity`]: `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1 &1000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Component:\n  - component: {fileID: 2000}\n  - component: {fileID: 3000}\n  m_Layer: 0\n  m_Name: Main Camera\n  m_TagString: MainCamera\n  m_IsActive: 1\n--- !u!20 &2000\nCamera:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n  m_ClearFlags: 1\n  m_projectionMatrixMode: 1\n  near clip plane: 0.3\n  far clip plane: 1000\n  field of view: 60\n  orthographic size: 5\n--- !u!81 &3000\nAudioListener:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n--- !u!1 &4000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Component:\n  - component: {fileID: 5000}\n  - component: {fileID: 6000}\n  m_Layer: 0\n  m_Name: Rotating Cube\n  m_IsActive: 1\n--- !u!4 &5000\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 4000}\n  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n  m_LocalPosition: {x: 0, y: 0, z: 0}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n--- !u!65 &6000\nBoxCollider:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 4000}\n--- !u!114 &7000\nMonoBehaviour:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 4000}\n  m_Script: {fileID: 0}\n  m_Name: ${scriptName}\n  m_EditorClassIdentifier: \n  m_Enabled: 1\n  serializedVersion: 1\n  m_ComponentHideFlags: 0\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n# NOTE: Attach the ${scriptName} script in Unity to enable runtime behaviour.\n`,
  [`Assets/Scripts/${scriptName}.cs`]: `using UnityEngine;\n\npublic class ${scriptName} : MonoBehaviour\n{\n    [SerializeField] private float rotationSpeed = 45f;\n\n    private void Start()\n    {\n        Debug.Log("${projectName} loaded. ${sceneName} is ready.");\n    }\n\n    private void Update()\n    {\n        transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime, Space.World);\n    }\n}\n`,
  "Assets/Scenes/README.txt": `This directory contains the default scene generated for ${projectName}.\n\nOpen ${sceneName}.unity inside the Unity editor. If the ${scriptName} behaviour is not linked automatically, drag Assets/Scripts/${scriptName}.cs onto the Rotating Cube in the hierarchy.\n`,
});

function sanitizeProjectName(name) {
  if (typeof name !== "string") return DEFAULT_PROJECT_NAME;
  const trimmed = name.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/-+/g, "-");
  return trimmed || DEFAULT_PROJECT_NAME;
}

function sanitizeUnityIdentifier(name, fallback) {
  if (typeof name !== "string") return fallback;
  const cleaned = name.replace(/[^A-Za-z0-9_]+/g, "").replace(/^[0-9_]+/, "");
  return cleaned || fallback;
}

function buildProjectFiles(options) {
  const sceneName = sanitizeUnityIdentifier(options.sceneName, DEFAULT_SCENE_NAME);
  const scriptName = sanitizeUnityIdentifier(options.scriptName, DEFAULT_SCRIPT_NAME);
  return {
    files: projectFilesTemplate({ ...options, sceneName, scriptName }),
    sceneName,
    scriptName,
  };
}

async function writeUnityArchive(zipPath, options) {
  const { files, sceneName, scriptName } = buildProjectFiles(options);
  const output = createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve({ sceneName, scriptName }));
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    Object.entries(files).forEach(([relativePath, content]) => {
      const normalized = path.posix.join(options.projectName, relativePath.replace(/\\/g, "/"));
      archive.append(content, { name: normalized });
    });

    archive.finalize();
  });
}

app.post("/export", async (req, res) => {
  try {
    const projectName = sanitizeProjectName(req.body?.projectName);
    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });
    const zipFileName = `${projectName}-${Date.now()}.zip`;
    const zipPath = path.join(outDir, zipFileName);

    const { sceneName, scriptName } = await writeUnityArchive(zipPath, {
      projectName,
      sceneName: req.body?.sceneName,
      scriptName: req.body?.scriptName,
    });

    res.json({
      ok: true,
      path: zipPath,
      fileName: zipFileName,
      projectName,
      sceneName,
      scriptName,
    });
  } catch (e) {
    console.error("Failed to export Unity project", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
