import { NextResponse } from 'next/server';

// Record the time when the process started. Used to compute uptime.
const startTime = Date.now();

/**
 * Health check endpoint for the Next.js frontend.
 *
 * This endpoint returns a JSON object with a status string, the number of
 * seconds the process has been running, the application version (from
 * environment variables), and the number of loaded models. Update
 * `models_loaded` if your frontend maintains state about loaded models.
 */
export async function GET() {
  const uptimeSeconds = (Date.now() - startTime) / 1000;
  // Attempt to source version information from common environment variables.
  const version = process.env.APP_VERSION ?? process.env.npm_package_version ?? '0.0.0';
  const modelsLoaded = 0;
  return NextResponse.json({
    status: 'ok',
    uptime_seconds: uptimeSeconds,
    version,
    models_loaded: modelsLoaded,
  });
}
