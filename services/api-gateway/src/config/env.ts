import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  AUTH_SERVICE_URL: z.string().url(),
  BLACKROAD_API_URL: z.string().url(),
  SERVICE_TOKEN: z.string().min(1)
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  PORT: process.env.PORT,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  BLACKROAD_API_URL: process.env.BLACKROAD_API_URL,
  SERVICE_TOKEN: process.env.SERVICE_TOKEN
});
