/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          { type: "host", value: "www.blackroad.io" },
        ],
        destination: "https://blackroad.io/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          { type: "host", value: "blackroad.io" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: "https://blackroad.io/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
