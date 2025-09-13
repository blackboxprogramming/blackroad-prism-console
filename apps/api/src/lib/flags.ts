const cache: Record<string, boolean> = {};
export function flag(name: string, def=false) {
  if (name in cache) return cache[name];
  const v = process.env[`FLAGS_${name.toUpperCase()}`];
  return cache[name] = (v === '1' || v === 'true');
}
