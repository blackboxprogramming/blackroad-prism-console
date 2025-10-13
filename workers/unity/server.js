import express from "express";
import archiver from "archiver";
import crypto from "crypto";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";

const app = express();
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
  return `// ${scene.name}.unity\n// ${scene.description}\n%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1 &1000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Name: Main Camera\n  m_Component:\n  - component: {fileID: 1001}\n  - component: {fileID: 1002}\n  - component: {fileID: 1003}\n  m_Transform: {fileID: 1004}\n--- !u!20 &1001\nCamera:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n  field of view: 60\n  m_FocalLength: 50\n  near clip plane: 0.3\n  far clip plane: 1000\n--- !u!81 &1002\nAudioListener:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n--- !u!92 &1003\nBehaviour:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n--- !u!4 &1004\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 1000}\n  m_LocalPosition: {x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}}\n  m_LocalRotation: {x: ${rotation.x.toFixed(3)}, y: ${rotation.y.toFixed(3)}, z: ${rotation.z.toFixed(3)}, w: 1}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n--- !u!1 &2000\nGameObject:\n  m_ObjectHideFlags: 0\n  m_Name: Scene Bootstrap\n  m_Component:\n  - component: {fileID: 2001}\n  m_Transform: {fileID: 2002}\n--- !u!4 &2002\nTransform:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 2000}\n  m_LocalPosition: {x: 0, y: 0, z: 0}\n  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}\n  m_LocalScale: {x: 1, y: 1, z: 1}\n--- !u!114 &2001\nMonoBehaviour:\n  m_ObjectHideFlags: 0\n  m_GameObject: {fileID: 2000}\n  m_Script: {fileID: 11500000, guid: ${bootstrapGuid}, type: 3}\n  m_Name: SceneBootstrap\n  m_EditorClassIdentifier: \n  sceneLabel: ${scene.name}\n  sceneDescription: ${scene.description}\n  rotationSpeed: ${scene.rotationSpeed}\n`;
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

    res.json({
      ok: true,
      path: zipPath,
      fileName: zipFileName,
      project: projectMetadata,
    });
  } catch (error) {
    console.error("Unity exporter failed", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
