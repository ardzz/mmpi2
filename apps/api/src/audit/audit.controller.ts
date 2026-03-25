import { Controller, Get, Header, Inject, Query } from '@nestjs/common';
import { UserRole } from '@mmpi2/contracts';
import { RequireMinRole } from '../auth';
import { AuditService } from './audit.service';

@Controller('admin')
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @RequireMinRole(UserRole.ADMIN)
  @Get('audit')
  listAdminAuditEvents(@Query('q') q?: string, @Query('source') source?: string) {
    return this.auditService.listAdminAuditEvents({ q, source });
  }

  @RequireMinRole(UserRole.ADMIN)
  @Get('audit/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="audit-log.csv"')
  exportAdminAuditEventsCsv(@Query('q') q?: string, @Query('source') source?: string) {
    return this.auditService.exportAdminAuditEventsCsv({ q, source });
  }
}
