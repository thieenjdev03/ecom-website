import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('bearer')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin audit logs' })
  @ApiOkResponse({ description: 'Audit logs retrieved successfully' })
  findAll(@Query() query: QueryAuditLogDto) {
    return this.service.findAll(query);
  }
}
