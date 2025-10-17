/** @type {import('next').NextConfig} */
const withPreviewBasePath = () => {
  // Accepts "/pr-123" or "pr-123"; normalizes to "/pr-123"
  const raw = process.env.BASE_PATH?.trim();
  const basePath = raw ? (raw.startsWith('/') ? raw : `/${raw}`) : '';

  // Don’t set basePath for dev server (hot reload comfort),
  // but do apply it on CI/builds and production runtime.
  const isProd = process.env.NODE_ENV === 'production';
  const effectiveBasePath = isProd && basePath ? basePath : '';

  /** Rewrites so the app still resolves assets and API routes
   *  even if someone hits paths without the prefix (optional).
   *  You can remove this block if you want strict prefixed-only paths.
   */
  const rewrites = async () => {
    if (!effectiveBasePath) return [];
    return [
      // Serve everything under /pr-###/ from the app root
      { source: `${effectiveBasePath}/:path*`, destination: '/:path*' },
    ];
  };

  /** Headers to set a robust base for client navigation (optional) */
  const headers = async () => {
    if (!effectiveBasePath) return [];
    return [
      {
        source: `${effectiveBasePath}/:path*`,
        headers: [{ key: 'X-Preview-Base-Path', value: effectiveBasePath }],
      },
    ];
  };

  return {
    reactStrictMode: true,
    // Only apply basePath when set and in production builds
    basePath: effectiveBasePath || undefined,
    // If you export static assets, this keeps <Image>, CSS, and public/ working
    assetPrefix: effectiveBasePath || undefined,
    // If you use next/image with remote domains, keep your existing images config
    images: { unoptimized: false },
    async rewrites() {
      return rewrites();
    },
    async headers() {
      return headers();
    },
  };
};

export default withPreviewBasePath();
