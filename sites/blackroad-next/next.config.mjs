/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    const raw = process.env.BASE_PATH?.trim();
    const base = raw ? (raw.startsWith('/') ? raw : `/${raw}`) : '';
    if (!base) return [];
    return [
      {
        source: `${base}`,
        destination: `${base}/`,
        permanent: false,
      },
    ];
  },
};
export default nextConfig;
