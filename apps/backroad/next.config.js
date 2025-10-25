/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    dirs: ['app', 'components', 'hooks', 'lib', 'mocks', 'tests'],
  },
  env: {
    MOCK_MODE: process.env.MOCK_MODE ?? 'true',
    BACKROAD_API_URL: process.env.BACKROAD_API_URL ?? 'http://localhost:3000',
  },
};

module.exports = nextConfig;
