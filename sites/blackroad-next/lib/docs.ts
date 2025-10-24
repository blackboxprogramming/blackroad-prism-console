import { readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = join(process.cwd(), "content", "docs");

type DocIndexEntry = { slug: string; title: string; path: string };

export type Doc = { slug: string; title: string; html: string };

type DocIndex = { docs: DocIndexEntry[] };

function loadIndex(): DocIndex {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public", "docs.index.json"), "utf-8")
    ) as DocIndex;
  } catch (error) {
    return { docs: [] };
  }
}

export function renderDoc(slug: string): Doc | null {
  const idx = loadIndex();
  const entry = idx.docs.find((doc) => doc.slug === slug.toLowerCase());
  if (!entry) {
    return null;
  }

  const file = join(ROOT, entry.path);
  try {
    const raw = readFileSync(file, "utf-8");
    const { content } = matter(raw);
    const title = (content.match(/^#\s+(.+)/m) || ["", "Untitled"])[1].trim();
    const html = marked.parse(content) as string;
    return { slug: entry.slug, title, html };
  } catch (error) {
    return null;
  }
}

export function readIndex(): DocIndex {
  return loadIndex();
}
