import type { AuditEventType } from './events.js';

export interface AuditEventPayload {
  eventType: AuditEventType;
  actorId: string;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogger {
  log(event: AuditEventPayload): Promise<void>;
}
