export const API_BASE = process.env.NEXT_PUBLIC_API ?? 'https://api.blackroad.io';

export const get = (path: string, init?: RequestInit) => {
  return fetch(`${API_BASE}${path}`, { ...init });
};
