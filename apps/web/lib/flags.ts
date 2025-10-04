import fs from 'node:fs';
import path from 'node:path';

type FlagConfig = {
  demo_mode?: boolean;
  features?: Record<string, unknown>;
};

type ResolvedFlags = {
  demo_mode: boolean;
  features: Record<string, boolean>;
};

let cached: ResolvedFlags | null = null;

function resolveFlagsPath(): string | null {
  const fromEnv = process.env.FLAGS_PATH;
  if (fromEnv) {
    const resolved = path.isAbsolute(fromEnv)
      ? fromEnv
      : path.resolve(process.cwd(), fromEnv);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const candidates = [
    'config/flags.json',
    '../config/flags.json',
    '../../config/flags.json',
    '../../../config/flags.json',
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
}

function loadFlags(): ResolvedFlags {
  const fallback: ResolvedFlags = { demo_mode: false, features: {} };
  const filePath = resolveFlagsPath();
  if (!filePath) {
    return fallback;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as FlagConfig;
    const features: Record<string, boolean> = {};
    if (parsed.features && typeof parsed.features === 'object') {
      for (const [key, value] of Object.entries(parsed.features)) {
        features[key] = Boolean(value);
      }
    }

    return {
      demo_mode: Boolean(parsed.demo_mode),
      features,
    };
  } catch (error) {
    console.warn('Failed to read feature flags from disk:', error);
    return fallback;
  }
}

export function getFlags(): ResolvedFlags {
  if (!cached) {
    cached = loadFlags();
  }
  return cached;
}

export function isOn(key: string): boolean {
  return Boolean(getFlags().features[key]);
}

export function resetFlagsCache(): void {
  cached = null;
}
