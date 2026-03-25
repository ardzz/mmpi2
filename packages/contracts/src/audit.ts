import { z } from 'zod';

export const AdminAuditEventSource = {
  SESSION: 'session',
  PAYMENT: 'payment',
  REPORT: 'report',
  AUDIT_LOG: 'audit_log',
} as const;

export type AdminAuditEventSource =
  (typeof AdminAuditEventSource)[keyof typeof AdminAuditEventSource];

export const AdminAuditEventSourceSchema = z.enum([
  'session',
  'payment',
  'report',
  'audit_log',
]);

export const AdminAuditEventSchema = z.object({
  id: z.string().uuid(),
  source: AdminAuditEventSourceSchema,
  actorUserId: z.string().uuid().nullable(),
  actorLabel: z.string().nullable(),
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1).max(100),
  summary: z.string().min(1).max(500),
  occurredAt: z.coerce.date(),
});

export type AdminAuditEvent = z.infer<typeof AdminAuditEventSchema>;
