/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    appDir: true
  },
  output: 'standalone'
};

export default config;
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
