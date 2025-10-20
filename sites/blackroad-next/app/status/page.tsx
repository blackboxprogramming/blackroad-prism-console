import { headers } from "next/headers";

function resolveBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL;
  if (envBase) {
    try {
      const normalized = envBase.startsWith("http") ? envBase : `https://${envBase}`;
      return new URL(normalized).toString();
    } catch {
      // ignore invalid env values and fall back to headers
    }
  }

  const headerList = headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  if (!host) return null;
  const protocol = headerList.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function getStatus() {
  try {
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) return null;
    const res = await fetch(new URL("/status.json", baseUrl), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const doc = await getStatus();
  return (
    <section className="container-x py-12">
      <h2 className="h2 mb-4">Status</h2>
      <pre className="card overflow-x-auto text-sm">
        {doc ? JSON.stringify(doc, null, 2) : "No status.json found"}
      </pre>
    </section>
  );
}
