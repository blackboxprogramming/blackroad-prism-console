export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Helper to prefix routes safely (avoids double slashes)
export const withBase = (path = '/') => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return BASE_PATH ? `${BASE_PATH}${normalized}` : normalized;
};
