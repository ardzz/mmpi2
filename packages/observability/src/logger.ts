/**
 * Minimal structured logger interface.
 * Implementations (e.g. Pino, Winston) plug into this contract.
 */

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
}

export function createConsoleLogger(name?: string): Logger {
  const prefix = name ? `[${name}]` : '';
  return {
    debug: (msg, ctx) => console.debug(prefix, msg, ctx ?? ''),
    info: (msg, ctx) => console.info(prefix, msg, ctx ?? ''),
    warn: (msg, ctx) => console.warn(prefix, msg, ctx ?? ''),
    error: (msg, err, ctx) => console.error(prefix, msg, err ?? '', ctx ?? ''),
  };
}
