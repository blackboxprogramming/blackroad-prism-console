import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const routeSchema = z.object({
  prefix: z.string().min(1),
  target: z.string().min(1),
  auth: z.enum(['required', 'public']).default('required')
});

const routesSchema = z.object({
  routes: z.array(routeSchema)
});

export type GatewayRoute = z.infer<typeof routeSchema>;

const defaultRoutesPath = fileURLToPath(new URL('../../config/routes.json', import.meta.url));

export async function loadRoutes(filePath = defaultRoutesPath) {
  const raw = await readFile(filePath, 'utf8');
  const parsed = routesSchema.parse(JSON.parse(raw));
  return parsed.routes;
}
