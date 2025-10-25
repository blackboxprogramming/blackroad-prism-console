const WINDOW_KEY = 'rw-attempts-window';

type RateLimitWindow = {
  userId: string;
  timestamps: number[];
};

const DEFAULT_WINDOW = 10 * 60 * 1000;
const DEFAULT_MAX = 3;

function readWindow(): RateLimitWindow | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(WINDOW_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RateLimitWindow;
  } catch (error) {
    console.warn('Failed to parse rate limit window', error);
    window.localStorage.removeItem(WINDOW_KEY);
    return null;
  }
}

function writeWindow(windowState: RateLimitWindow) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WINDOW_KEY, JSON.stringify(windowState));
}

export function rateLimitAttempts(
  userId: string,
  windowMs = DEFAULT_WINDOW,
  max = DEFAULT_MAX
): { allowed: boolean; remaining: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: max };
  }

  const now = Date.now();
  const existing = readWindow();
  const filtered = existing && existing.userId === userId
    ? existing.timestamps.filter((ts) => now - ts < windowMs)
    : [];

  if (filtered.length >= max) {
    writeWindow({ userId, timestamps: filtered });
    return { allowed: false, remaining: 0 };
  }

  const next = [...filtered, now];
  writeWindow({ userId, timestamps: next });
  return { allowed: true, remaining: max - next.length };
}

export function clearRateLimitWindow() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WINDOW_KEY);
}
