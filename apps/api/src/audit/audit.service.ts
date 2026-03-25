import {
  AdminAuditEventSchema,
  AdminAuditEventSource,
  type AdminAuditEvent,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { Injectable } from '@nestjs/common';

type SessionAuditRow = {
  id: string;
  eventType: string;
  occurredAt: Date;
  examSession: {
    id: string;
    patient: {
      fullName: string;
    };
  };
};

type PaymentAuditRow = {
  id: string;
  eventType: string;
  occurredAt: Date;
  payment: {
    id: string;
    assessmentRequest: {
      id: string;
      patient: {
        fullName: string;
      };
    };
  };
};

type ReportSignatureRow = {
  id: string;
  signedAt: Date;
  clinicalReport: {
    id: string;
    authoredBy: {
      id: string;
      fullName: string;
    };
  };
};

type ReportAmendmentRow = {
  id: string;
  amendmentReason: string;
  createdAt: Date;
  clinicalReport: {
    id: string;
    authoredBy: {
      id: string;
      fullName: string;
    };
  };
};

type AuditLogRow = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: Date;
  actor: {
    fullName: string;
  } | null;
};

@Injectable()
export class AuditService {
  async listAdminAuditEvents(query?: { q?: string; source?: string }): Promise<AdminAuditEvent[]> {
    const [sessionEvents, paymentEvents, signatures, amendments, auditLogs] = await Promise.all([
      prisma.sessionEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 25,
        include: {
          examSession: {
            select: {
              id: true,
              patient: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.paymentEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 25,
        include: {
          payment: {
            select: {
              id: true,
              assessmentRequest: {
                select: {
                  id: true,
                  patient: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.reportSignature.findMany({
        orderBy: { signedAt: 'desc' },
        take: 25,
        include: {
          clinicalReport: {
            select: {
              id: true,
              authoredBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.clinicalReportAmendment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          clinicalReport: {
            select: {
              id: true,
              authoredBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 25,
        include: {
          actor: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    const normalized = [
      ...(sessionEvents as unknown as SessionAuditRow[]).map((event) =>
        AdminAuditEventSchema.parse({
          id: event.id,
          source: AdminAuditEventSource.SESSION,
          actorUserId: null,
          actorLabel: null,
          action: event.eventType,
          entityType: 'exam_session',
          entityId: event.examSession.id,
          summary: `${event.eventType} for ${event.examSession.patient.fullName}`,
          occurredAt: event.occurredAt,
        }),
      ),
      ...(paymentEvents as unknown as PaymentAuditRow[]).map((event) =>
        AdminAuditEventSchema.parse({
          id: event.id,
          source: AdminAuditEventSource.PAYMENT,
          actorUserId: null,
          actorLabel: null,
          action: event.eventType,
          entityType: 'payment',
          entityId: event.payment.id,
          summary: `${event.eventType} for request ${event.payment.assessmentRequest.id.slice(0, 8)} (${event.payment.assessmentRequest.patient.fullName})`,
          occurredAt: event.occurredAt,
        }),
      ),
      ...(signatures as unknown as ReportSignatureRow[]).map((signature) =>
        AdminAuditEventSchema.parse({
          id: signature.id,
          source: AdminAuditEventSource.REPORT,
          actorUserId: signature.clinicalReport.authoredBy.id,
          actorLabel: signature.clinicalReport.authoredBy.fullName,
          action: 'report_signed',
          entityType: 'clinical_report',
          entityId: signature.clinicalReport.id,
          summary: `Report signed by ${signature.clinicalReport.authoredBy.fullName}`,
          occurredAt: signature.signedAt,
        }),
      ),
      ...(amendments as unknown as ReportAmendmentRow[]).map((amendment) =>
        AdminAuditEventSchema.parse({
          id: amendment.id,
          source: AdminAuditEventSource.REPORT,
          actorUserId: amendment.clinicalReport.authoredBy.id,
          actorLabel: amendment.clinicalReport.authoredBy.fullName,
          action: 'report_amended',
          entityType: 'clinical_report',
          entityId: amendment.clinicalReport.id,
          summary: amendment.amendmentReason,
          occurredAt: amendment.createdAt,
        }),
      ),
      ...(auditLogs as unknown as AuditLogRow[]).map((log) =>
        AdminAuditEventSchema.parse({
          id: log.id,
          source: AdminAuditEventSource.AUDIT_LOG,
          actorUserId: log.actorUserId,
          actorLabel: log.actor?.fullName ?? null,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: `${log.action} on ${log.entityType}`,
          occurredAt: log.occurredAt,
        }),
      ),
    ];

    const normalizedQuery = query?.q?.trim().toLowerCase() ?? '';
    const sourceFilter = query?.source?.trim().toLowerCase() ?? '';

    return normalized
      .filter((event) => {
        const matchesSource = sourceFilter.length === 0 || event.source.toLowerCase() === sourceFilter;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [
            event.actorLabel ?? 'system',
            event.action,
            event.entityType,
            event.entityId,
            event.summary,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        return matchesSource && matchesQuery;
      })
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
      .slice(0, 50);
  }

  async exportAdminAuditEventsCsv(query?: { q?: string; source?: string }): Promise<string> {
    const events = await this.listAdminAuditEvents(query);
    const header = ['occurred_at', 'source', 'actor_label', 'action', 'entity_type', 'entity_id', 'summary'];
    const rows = events.map((event) => [
      event.occurredAt.toISOString(),
      event.source,
      event.actorLabel ?? 'system',
      event.action,
      event.entityType,
      event.entityId,
      event.summary,
    ]);

    return [header, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }
}
