import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { exportUnityProject } from "../src/exporter.js";
import { listEntries, readEntry } from "./helpers/zip.js";

test("exportUnityProject creates a Unity-ready archive", async (t) => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "unity-export-"));
  t.after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const result = await exportUnityProject({
    projectName: "BlackRoad Sandbox",
    sceneName: "Prototype Scene",
    scriptName: "Sandbox Controller",
    description: "Exploration sandbox starting point",
    author: "Sim Team",
    projectVersion: "2022.3.29f1",
    namespace: "BlackRoad.Sandbox",
    outputDir: tempDir,
    zipFileName: "sandbox.zip",
  });

  assert.ok(result.bytes > 0, "zip archive should have content");
  assert.equal(result.metadata.projectName, "BlackRoad Sandbox");
  assert.equal(result.metadata.sceneName, "PrototypeScene");
  assert.equal(result.metadata.scriptName, "SandboxController");
  assert.equal(result.metadata.projectVersion, "2022.3.29f1");

  const entries = await listEntries(result.zipPath);
  const expectedPrefix = `${result.projectFolder}/`;
  const expectedFiles = [
    `${expectedPrefix}README.md`,
    `${expectedPrefix}Packages/manifest.json`,
    `${expectedPrefix}ProjectSettings/ProjectVersion.txt`,
    `${expectedPrefix}Assets/Scenes/PrototypeScene.unity`,
    `${expectedPrefix}Assets/Scripts/SandboxController.cs`,
    `${expectedPrefix}BlackRoad/export.json`,
  ];

  for (const file of expectedFiles) {
    assert(entries.includes(file), `Expected ${file} in archive`);
  }

  const readme = await readEntry(result.zipPath, `${expectedPrefix}README.md`);
  assert.match(readme, /BlackRoad Sandbox/);
  assert.match(readme, /PrototypeScene/);

  const manifest = JSON.parse(
    await readEntry(result.zipPath, `${expectedPrefix}Packages/manifest.json`)
  );
  assert.ok(manifest.dependencies["com.unity.cinemachine"], "Cinemachine dependency missing");

  const exportMetadata = JSON.parse(
    await readEntry(result.zipPath, `${expectedPrefix}BlackRoad/export.json`)
  );
  assert.equal(exportMetadata.sceneName, "PrototypeScene");
  assert.equal(exportMetadata.script, "SandboxController");
  assert.equal(exportMetadata.namespace, "BlackRoad.Sandbox");
});
