import express from "express";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import archiver from "archiver";

const DEFAULT_PROJECT_NAME = "BlackRoadUnityTemplate";

const TEMPLATE_FILES = (
  projectName,
  description
) => {
  const sanitizedDescription = description?.trim() ||
    "Generated Unity template scaffolded by the Prism console worker.";
  const readme = `# ${projectName}\n\n${sanitizedDescription}\n\n` +
    "## Getting started\n" +
    "1. Open this folder in Unity Hub.\n" +
    "2. Let Unity upgrade assets if prompted.\n" +
    "3. Press Play to run the SampleScene.\n";

  const manifest = {
    dependencies: {
      "com.unity.collab-proxy": "1.17.7",
      "com.unity.ide.rider": "3.0.24",
      "com.unity.ide.visualstudio": "2.0.22",
      "com.unity.ide.vscode": "1.2.5",
      "com.unity.test-framework": "1.3.9",
      "com.unity.textmeshpro": "3.0.6",
      "com.unity.timeline": "1.7.6",
      "com.unity.ugui": "1.0.0",
      "com.unity.modules.ai": "1.0.0",
      "com.unity.modules.animation": "1.0.0",
      "com.unity.modules.audio": "1.0.0",
      "com.unity.modules.physics": "1.0.0",
      "com.unity.modules.ui": "1.0.0"
    }
  };

  const sampleScene = `%
YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
Scene:
  m_ObjectHideFlags: 0
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_RootOrder: 0
  m_EditorData: {}
  m_Entities:
  - {fileID: 2}
  - {fileID: 4}
--- !u!1 &2
GameObject:
  m_Component:
  - component: {fileID: 3}
  m_Name: Main Camera
--- !u!20 &3
Camera:
  m_ClearFlags: 1
  m_BackGroundColor: {r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 0}
  near clip plane: 0.3
  far clip plane: 1000
--- !u!1 &4
GameObject:
  m_Component:
  - component: {fileID: 5}
  m_Name: Directional Light
--- !u!108 &5
Light:
  m_Type: 1
  m_Color: {r: 1, g: 0.95686275, b: 0.8392157, a: 1}
`;

  return [
    {
      path: "README.md",
      content: readme
    },
    {
      path: "ProjectSettings/ProjectVersion.txt",
      content:
        "m_EditorVersion: 2022.3.0f1\nm_EditorVersionWithRevision: 2022.3.0f1 (1234567890abcdef)\n"
    },
    {
      path: "Packages/manifest.json",
      content: JSON.stringify(manifest, null, 2) + "\n"
    },
    {
      path: "Assets/Scenes/SampleScene.unity",
      content: sampleScene
    },
    {
      path: "Assets/Scenes.meta",
      content:
        "fileFormatVersion: 2\nGUID: 00000000000000000000000000000000\nfolderAsset: yes\n"
    },
    {
      path: "Assets/Scenes/SampleScene.unity.meta",
      content:
        "fileFormatVersion: 2\nGUID: 11111111111111111111111111111111\n"
    }
  ];
};

function sanitizeProjectName(rawName) {
  if (typeof rawName !== "string") {
    return DEFAULT_PROJECT_NAME;
  }
  const normalized = rawName.trim().replace(/[^A-Za-z0-9_-]+/g, "-");
  const cleaned = normalized.replace(/^-+|-+$/g, "");
  return cleaned || DEFAULT_PROJECT_NAME;
}

async function writeTemplateZip(zipPath, files) {
  await mkdir(path.dirname(zipPath), { recursive: true });

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);

    files.forEach((file) => {
      archive.append(file.content, { name: file.path });
    });

    archive.finalize();
  });
}

const app = express();
app.use(express.json());

app.post("/export", async (_req, res) => {
  try {
    const projectName = sanitizeProjectName(_req.body?.projectName);
    const description = _req.body?.description;
    const outDir = path.join(process.cwd(), "downloads");
    const zipPath = path.join(outDir, `${projectName}.zip`);
    const files = TEMPLATE_FILES(projectName, description);
    await writeTemplateZip(zipPath, files);
    res.json({
      ok: true,
      path: zipPath,
      projectName,
      files: files.map((file) => file.path)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
