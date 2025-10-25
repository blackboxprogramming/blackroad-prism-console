const apiUrl = process.env.NEXT_PUBLIC_BLACKROAD_API_URL || process.env.BLACKROAD_API_URL;
const apiToken = process.env.NEXT_PUBLIC_BLACKROAD_API_TOKEN || process.env.BLACKROAD_API_TOKEN;

export const config = {
  apiUrl,
  apiToken,
  isOffline: !apiUrl
};
