import { z } from 'zod';

const booleanSchema = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  });

const envSchema = z.object({
  GATEWAY_PORT: z.coerce.number().int().nonnegative().default(8081),
  GATEWAY_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  GATEWAY_LOG_LEVEL: z.string().default('info'),
  GATEWAY_CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) => value?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
  GATEWAY_RATE_LIMIT_RPM: z.coerce.number().int().positive().default(120),
  AUTH_BASE_URL: z.string().url(),
  AUTH_PUBLIC_CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(60_000),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  METRICS_ENABLED: booleanSchema,
  ROADGLITCH_BASE_URL: z.string().url().optional(),
  CONSOLE_BASE_URL: z.string().url().optional(),
  SEARCH_BASE_URL: z.string().url().optional()
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  isDev: boolean;
};

const parsed = envSchema.parse({
  GATEWAY_PORT: process.env.GATEWAY_PORT,
  GATEWAY_ENV: process.env.GATEWAY_ENV,
  GATEWAY_LOG_LEVEL: process.env.GATEWAY_LOG_LEVEL,
  GATEWAY_CORS_ORIGINS: process.env.GATEWAY_CORS_ORIGINS,
  GATEWAY_RATE_LIMIT_RPM: process.env.GATEWAY_RATE_LIMIT_RPM,
  AUTH_BASE_URL: process.env.AUTH_BASE_URL,
  AUTH_PUBLIC_CACHE_TTL_MS: process.env.AUTH_PUBLIC_CACHE_TTL_MS,
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  METRICS_ENABLED: process.env.METRICS_ENABLED,
  ROADGLITCH_BASE_URL: process.env.ROADGLITCH_BASE_URL,
  CONSOLE_BASE_URL: process.env.CONSOLE_BASE_URL,
  SEARCH_BASE_URL: process.env.SEARCH_BASE_URL
});

export const env: Env = {
  ...parsed,
  corsOrigins: parsed.GATEWAY_CORS_ORIGINS,
  isDev: parsed.GATEWAY_ENV !== 'prod',
  METRICS_ENABLED: parsed.METRICS_ENABLED ?? true
};
