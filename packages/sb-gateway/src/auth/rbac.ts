export interface GatewayContext {
  role?: string;
  token?: string;
  devToken?: string;
  logger?: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
  };
}

const allowedRoles = new Set(['admin', 'ml', 'research', 'ot']);

export function assertSinkhornAccess(context: GatewayContext) {
  if (!context.role || !allowedRoles.has(context.role)) {
    throw new Error('forbidden: missing sinkhorn capability');
  }
}

function redact(value?: string): string | undefined {
  if (!value) {
    return value;
  }
  const tail = value.slice(-4);
  return `***${tail}`;
}

export function logSafe(context: GatewayContext, message: string, meta: Record<string, unknown> = {}) {
  const sanitized = { ...meta };
  if (sanitized.token && typeof sanitized.token === 'string') {
    sanitized.token = redact(sanitized.token);
  }
  if (sanitized.devToken && typeof sanitized.devToken === 'string') {
    sanitized.devToken = redact(sanitized.devToken);
  }
  if (context.logger) {
    context.logger.info(message, sanitized);
  }
}
