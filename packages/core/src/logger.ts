import pino from "pino";

export const logger = pino({
  name: "blackroad-grc",
  level: process.env.GRC_LOG_LEVEL ?? "info",
});
