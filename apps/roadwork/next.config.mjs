/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['msw']
  },
  transpilePackages: [],
  redirects: async () => [],
  rewrites: async () => []
};

export default nextConfig;
