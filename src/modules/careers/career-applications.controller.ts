import { Controller, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CareersService } from './careers.service';
import {
  CareerApplicationDto,
  UpdateCareerApplicationDto,
} from './dto/career-application.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('careers')
@Controller('career-applications')
export class CareerApplicationsController {
  constructor(private readonly careersService: CareersService) {}

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application status (admin)' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiOkResponse({ type: CareerApplicationDto })
  update(@Param('id') id: string, @Body() dto: UpdateCareerApplicationDto) {
    return this.careersService.updateApplication(id, dto);
  }
}
