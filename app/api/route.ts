import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

interface Artifact {
  path: string;
  content: string;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const url = process.env.CODEX_API_URL || "http://localhost:8787";
  const payload = await req.json();

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (Array.isArray(data.artifacts)) {
    for (const file of data.artifacts as Artifact[]) {
      const abs = path.join(process.cwd(), file.path);
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, file.content);
    }
  }

  return NextResponse.json(data, { status: res.status });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
