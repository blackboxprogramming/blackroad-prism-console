import { z } from 'zod';

const envSchema = z.object({
  BLACKROAD_API_URL: z.string().url().default('https://console.blackroad.io/api/mobile/dashboard'),
  BLACKROAD_API_TOKEN: z.string().optional()
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  BLACKROAD_API_URL: process.env.BLACKROAD_API_URL,
  BLACKROAD_API_TOKEN: process.env.BLACKROAD_API_TOKEN
});
