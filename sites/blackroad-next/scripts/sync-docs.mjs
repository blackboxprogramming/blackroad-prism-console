import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join } from "path";

const REPO_DOCS = join(process.cwd(), "..", "..", "docs");
const CONTENT_DEST = join(process.cwd(), "content", "docs");
const STATIC_SOURCE = join(process.cwd(), "..", "..", "sites", "blackroad", "public", "docs");
const STATIC_DEST = join(process.cwd(), "public", "docs");

mkdirSync(CONTENT_DEST, { recursive: true });

function copyMarkdown(source, dest) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = join(source, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyMarkdown(srcPath, destPath);
    } else if (entry.name.endsWith(".md")) {
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

function copyStatic(source, dest) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = join(source, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyStatic(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyMarkdown(REPO_DOCS, CONTENT_DEST);
  console.log("[docs] synced markdown into content/docs");
} catch (error) {
  if ((error ?? {}).code !== "ENOENT") {
    throw error;
  }
}

try {
  mkdirSync(STATIC_DEST, { recursive: true });
  copyStatic(STATIC_SOURCE, STATIC_DEST);
  console.log("[docs] synced static docs assets");
} catch (error) {
  if ((error ?? {}).code !== "ENOENT") {
    throw error;
  }
}
