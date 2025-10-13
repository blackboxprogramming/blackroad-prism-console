import express from "express";
import archiver from "archiver";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";

const DEFAULT_PROJECT_NAME = "BlackRoadUnityProject";
const DEFAULT_SCENES = ["SampleScene"];
const SCRIPT_FILE = "HelloBlackRoad.cs";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/export", async (req, res) => {
  try {
    const { projectName, description, scenes } = req.body ?? {};
    const normalizedProjectName = normalizeProjectName(projectName);
    const projectScenes = normalizeScenes(scenes);

    const outDir = path.join(process.cwd(), "downloads");
    await mkdir(outDir, { recursive: true });

    const archiveName = `${toArchiveSlug(normalizedProjectName)}-${timestampSlug()}.zip`;
    const zipPath = path.join(outDir, archiveName);

    await createUnityArchive({
      projectName: normalizedProjectName,
      description: typeof description === "string" ? description : "",
      scenes: projectScenes,
      destination: zipPath,
    });

    res.json({
      ok: true,
      path: zipPath,
      archive: archiveName,
      projectName: normalizedProjectName,
      scenes: projectScenes.map((scene) => scene.displayName),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));

function normalizeProjectName(name) {
  const cleaned = cleanLabel(name);
  return cleaned || DEFAULT_PROJECT_NAME;
}

function normalizeScenes(sceneInput) {
  const seen = new Set();
  const requested = Array.isArray(sceneInput)
    ? sceneInput
        .map((value) => cleanLabel(value))
        .filter((value) => value)
    : [];

  const picked = requested.length ? requested : DEFAULT_SCENES;

  return picked
    .filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((displayName) => ({
      displayName,
      fileName: toSceneFileName(displayName),
      guid: unityGuid(),
    }));
}

function toSceneFileName(name) {
  const cleaned = name
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const safe = cleaned
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${safe || "Scene"}.unity`;
}

function toArchiveSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "unity-project";
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function createUnityArchive({ projectName, description, scenes, destination }) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const output = createWriteStream(destination);
  const completion = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);

  addReadme(archive, projectName, description);
  addProjectSettings(archive, scenes);
  addPackagesManifest(archive);
  const scriptGuid = addSampleScript(archive, projectName, description);
  addSceneFiles(archive, scenes, projectName, scriptGuid);

  archive.finalize();
  await completion;
}

function addReadme(archive, projectName, description) {
  const lines = [
    `# ${projectName}`,
    "",
    description ? description : "Generated Unity project stub created by the BlackRoad exporter.",
    "",
    "## Getting Started",
    "1. Unzip the archive into your Unity workspace.",
    "2. Open the project with Unity 2022.3 LTS or newer.",
    "3. Load the generated scene from `Assets/Scenes` to start iterating.",
    "",
    `Generated on ${new Date().toISOString()}.`,
  ];

  archive.append(lines.join("\n"), { name: "README.md" });
}

function addProjectSettings(archive, scenes) {
  archive.append(projectVersionContent(), {
    name: "ProjectSettings/ProjectVersion.txt",
  });

  archive.append(editorBuildSettingsContent(scenes), {
    name: "ProjectSettings/EditorBuildSettings.asset",
  });
}

function projectVersionContent() {
  return [
    "m_EditorVersion: 2022.3.16f1",
    "m_EditorVersionWithRevision: 2022.3.16f1 (c9b01bd14708)",
    "",
  ].join("\n");
}

function editorBuildSettingsContent(scenes) {
  const lines = ["m_ObjectHideFlags: 0", "serializedVersion: 2", "m_Scenes:"];
  if (!scenes.length) {
    lines.push("  []");
  } else {
    scenes.forEach((scene) => {
      lines.push("  - enabled: 1");
      lines.push(`    path: Assets/Scenes/${scene.fileName}`);
      lines.push(`    guid: ${scene.guid}`);
    });
  }
  lines.push("m_configObjects: {}");
  return lines.join("\n");
}

function addPackagesManifest(archive) {
  const manifest = {
    dependencies: {
      "com.unity.collab-proxy": "2.0.3",
      "com.unity.ide.visualstudio": "2.0.22",
      "com.unity.ide.rider": "3.0.20",
      "com.unity.ide.vscode": "1.2.5",
      "com.unity.test-framework": "1.3.9",
      "com.unity.textmeshpro": "3.0.6",
      "com.unity.timeline": "1.7.4",
      "com.unity.ugui": "1.0.0",
    },
    registry: "https://packages.unity.com",
  };

  archive.append(`${JSON.stringify(manifest, null, 2)}\n`, {
    name: "Packages/manifest.json",
  });
}

function addSceneFiles(archive, scenes, projectName, scriptGuid) {
  scenes.forEach((scene) => {
    const sceneContent = unitySceneContent(scene.displayName, projectName, scriptGuid);
    archive.append(sceneContent, {
      name: `Assets/Scenes/${scene.fileName}`,
    });

    archive.append(defaultMetaFile(scene.guid), {
      name: `Assets/Scenes/${scene.fileName}.meta`,
    });
  });
}

function unitySceneContent(sceneName, projectName, scriptGuid) {
  const description = yamlString(`Generated by the BlackRoad Unity exporter for ${projectName}.`);
  return [
    "%YAML 1.1",
    "%TAG !u! tag:unity3d.com,2011:",
    "--- !u!29 &1",
    "SceneSettings:",
    "  m_ObjectHideFlags: 0",
    "  m_PVSData: \n",
    "  m_PVSObjectsArray: []",
    "  m_PVSPortalsArray: []",
    "--- !u!1 &100000",
    "GameObject:",
    "  m_ObjectHideFlags: 0",
    "  m_CorrespondingSourceObject: {fileID: 0}",
    "  m_PrefabInstance: {fileID: 0}",
    "  m_PrefabAsset: {fileID: 0}",
    "  serializedVersion: 6",
    "  m_Component:",
    "  - component: {fileID: 400000}",
    "  - component: {fileID: 11400000}",
    "  m_Layer: 0",
    `  m_Name: ${sceneName}`,
    "  m_TagString: Untagged",
    "  m_Icon: {fileID: 0}",
    "  m_NavMeshLayer: 0",
    "  m_StaticEditorFlags: 0",
    "  m_IsActive: 1",
    "--- !u!4 &400000",
    "Transform:",
    "  m_ObjectHideFlags: 0",
    "  m_CorrespondingSourceObject: {fileID: 0}",
    "  m_PrefabInstance: {fileID: 0}",
    "  m_PrefabAsset: {fileID: 0}",
    "  m_GameObject: {fileID: 100000}",
    "  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}",
    "  m_LocalPosition: {x: 0, y: 0, z: 0}",
    "  m_LocalScale: {x: 1, y: 1, z: 1}",
    "  m_Children: []",
    "  m_Father: {fileID: 0}",
    "  m_RootOrder: 0",
    "  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}",
    "--- !u!114 &11400000",
    "MonoBehaviour:",
    "  m_ObjectHideFlags: 0",
    "  m_CorrespondingSourceObject: {fileID: 0}",
    "  m_PrefabInstance: {fileID: 0}",
    "  m_PrefabAsset: {fileID: 0}",
    "  m_GameObject: {fileID: 100000}",
    "  m_Enabled: 1",
    "  m_EditorHideFlags: 0",
    `  m_Script: {fileID: 11500000, guid: ${scriptGuid}, type: 3}`,
    `  m_Name: ${projectName} Controller`,
    "  m_EditorClassIdentifier: ",
    `  Description: ${description}`,
    "  RotationSpeed: 30",
  ].join("\n") + "\n";
}

function addSampleScript(archive, projectName, description) {
  const script = sampleScriptContent(projectName, description);
  archive.append(script, {
    name: `Assets/Scripts/${SCRIPT_FILE}`,
  });

  const guid = unityGuid();
  archive.append(monoScriptMeta(guid), {
    name: `Assets/Scripts/${SCRIPT_FILE}.meta`,
  });
  return guid;
}

function sampleScriptContent(projectName, description) {
  const safeDescription = description?.replace(/`/g, "'") ?? "";
  const summary = safeDescription || "This script spins the attached object so you have a visual reference that play mode works.";
  const projectLiteral = escapeForCSharp(projectName);
  const descriptionLiteral = escapeForCSharp(description ?? "Welcome to your new Unity project!");
  return `using UnityEngine;\n\n/// <summary>\n/// Auto-generated scaffold for ${projectName}.\n/// ${summary}\n/// </summary>\n[AddComponentMenu("BlackRoad/Hello BlackRoad")]\npublic class HelloBlackRoad : MonoBehaviour\n{\n    [TextArea]\n    public string Description = "${descriptionLiteral}";\n\n    public float RotationSpeed = 30f;\n\n    private void Start()\n    {\n        Debug.Log($"${projectLiteral} booted successfully.");\n    }\n\n    private void Update()\n    {\n        transform.Rotate(Vector3.up * RotationSpeed * Time.deltaTime, Space.World);\n    }\n}\n`;
}

function escapeForCSharp(value) {
  const text = typeof value === "string" ? value : String(value);
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function monoScriptMeta(guid) {
  return [
    "fileFormatVersion: 2",
    `guid: ${guid}`,
    "MonoImporter:",
    "  externalObjects: {}",
    "  serializedVersion: 2",
    "  defaultReferences: []",
    "  executionOrder: 0",
    "  icon: {instanceID: 0}",
    "  userData: ",
    "  assetBundleName: ",
    "  assetBundleVariant: ",
  ].join("\n") + "\n";
}

function defaultMetaFile(guid) {
  return [
    "fileFormatVersion: 2",
    `guid: ${guid}`,
    "DefaultImporter:",
    "  externalObjects: {}",
    "  userData: ",
    "  assetBundleName: ",
    "  assetBundleVariant: ",
  ].join("\n") + "\n";
}

function unityGuid() {
  return randomUUID().replace(/-/g, "").toLowerCase();
}

function yamlString(value) {
  const text = typeof value === "string" ? value : String(value);
  return `"${text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")}"`;
}

function cleanLabel(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z0-9 _\-\.()]/g, "")
    .trim()
    .slice(0, 80);
}
