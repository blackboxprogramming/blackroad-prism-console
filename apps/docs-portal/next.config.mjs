import { withContentlayer } from "next-contentlayer";

const config = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@blackroad/runbook-types"],
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    NEXT_PUBLIC_GATEWAY_BASE_URL: process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || ""
  }
};

export default withContentlayer(config);
