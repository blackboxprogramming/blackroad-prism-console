

export interface Resolved {
  name: string; char: string; codepoint: string; utf8: string;
  module: string; base: string; modifiers: string[]; variant?: string; source: string;
}
const BASE = "/api/symbols";

export async function resolveSymbol(name: string): Promise<Resolved> {
  const r = await fetch(`${BASE}/v1/resolve?name=${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error(`resolve failed: ${r.status}`);
  return r.json();
}

export async function batchResolve(names: string[]): Promise<Resolved[]> {
  const r = await fetch(`${BASE}/v1/batch`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ names }),
  });
  if (!r.ok) throw new Error(`batch failed: ${r.status}`);
  return r.json();
}
