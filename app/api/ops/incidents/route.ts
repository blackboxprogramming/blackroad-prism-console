import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

interface IncidentEntry {
  title: string;
  file: string;
  opened_at?: string;
  status?: string;
}

const INCIDENTS_DIR = process.env.OPS_INCIDENTS_PATH ?? path.resolve(process.cwd(), "../br-status-site/content/issues");
const INCIDENTS_URL = process.env.OPS_INCIDENTS_URL ?? "https://status.blackroad.io/content/issues/index.json";

function parseFrontMatter(content: string): Partial<IncidentEntry> {
  const title = content.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const status = content.match(/^status:\s*(.+)$/m)?.[1]?.trim();
  const opened =
    content.match(/^(?:opened_at|date|created_at):\s*(.+)$/m)?.[1]?.trim() ??
    content.match(/^timestamp:\s*(.+)$/m)?.[1]?.trim();
  return {
    title,
    status,
    opened_at: opened ? new Date(opened).toISOString() : undefined
  };
}

async function readFromFilesystem(dir: string): Promise<IncidentEntry[]> {
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) {
      return [];
    }
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    console.warn("[ops] unable to read incidents directory", error);
    return [];
  }

  const entries = await fs.readdir(dir);
  const incidents: IncidentEntry[] = [];
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  await Promise.all(
    entries
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const fullPath = path.join(dir, file);
        try {
          const [content, meta] = await Promise.all([fs.readFile(fullPath, "utf8"), fs.stat(fullPath)]);
          const frontMatter = parseFrontMatter(content);
          const openedAt = frontMatter.opened_at ?? meta.mtime.toISOString();
          if (new Date(openedAt).getTime() < cutoff) {
            return;
          }
          incidents.push({
            title: frontMatter.title ?? file.replace(/\.md$/, ""),
            file,
            opened_at: openedAt,
            status: frontMatter.status
          });
        } catch (error) {
          console.warn(`[ops] failed to read incident ${file}`, error);
        }
      })
  );

  incidents.sort((a, b) => {
    const aTime = a.opened_at ? new Date(a.opened_at).getTime() : 0;
    const bTime = b.opened_at ? new Date(b.opened_at).getTime() : 0;
    return bTime - aTime;
  });

  return incidents.slice(0, 10);
}

async function readFromRemote(url: string | undefined): Promise<IncidentEntry[]> {
  if (!url) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as IncidentEntry[];
    if (!Array.isArray(data)) {
      return [];
    }
    return data.slice(0, 10);
  } catch (error) {
    console.warn(`[ops] unable to fetch incidents from ${url}:`, error);
    return [];
  }
}

export async function GET() {
  const [localIncidents, remoteIncidents] = await Promise.all([
    readFromFilesystem(INCIDENTS_DIR),
    readFromRemote(INCIDENTS_URL)
  ]);

  const merged = [...localIncidents];
  if (remoteIncidents.length) {
    const existing = new Set(merged.map((item) => item.file));
    for (const incident of remoteIncidents) {
      if (!existing.has(incident.file)) {
        merged.push(incident);
      }
    }
  }

  merged.sort((a, b) => {
    const aTime = a.opened_at ? new Date(a.opened_at).getTime() : 0;
    const bTime = b.opened_at ? new Date(b.opened_at).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(merged.slice(0, 10));
}
