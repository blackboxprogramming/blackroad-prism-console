import { z } from 'zod';
import { env } from '@/lib/env';

export const metricSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  value: z.string(),
  caption: z.string(),
  icon: z.string(),
  status: z.enum(['healthy', 'warning', 'critical'])
});

export const shortcutSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  icon: z.string(),
  url: z.string().url()
});

export const dashboardSchema = z.object({
  summary: z.string(),
  metrics: z.array(metricSchema),
  shortcuts: z.array(shortcutSchema)
});

export type DashboardPayload = z.infer<typeof dashboardSchema>;

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardPayload> {
  const headers: Record<string, string> = {};
  if (env.BLACKROAD_API_TOKEN) {
    headers.Authorization = `Bearer ${env.BLACKROAD_API_TOKEN}`;
  }

  const response = await fetch(env.BLACKROAD_API_URL, {
    headers,
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard (${response.status})`);
  }

  const data = await response.json();
  return dashboardSchema.parse(data);
}
