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
    GATEWAY_BASE_URL: process.env.GATEWAY_BASE_URL || ""
  }
};

export default withContentlayer(config);
