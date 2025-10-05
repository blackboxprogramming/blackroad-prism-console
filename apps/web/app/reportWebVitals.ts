'use client';

import type { NextWebVitalsMetric } from 'next/app';

const buildMetricsUrl = () => {
  const base = process.env.NEXT_PUBLIC_OTLP_HTTP ?? '/otlp';
  return `${base.replace(/\/$/, '')}/v1/metrics`;
};

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof navigator === 'undefined') return;

  const payload = JSON.stringify({ metric });
  const url = buildMetricsUrl();

  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(url, payload);
    return;
  }

  fetch(url, {
    method: 'POST',
    keepalive: true,
    body: payload,
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {
    // Swallow errors; telemetry should never block UX.
  });
}
