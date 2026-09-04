import {
  Controller,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CareersService } from './careers.service';
import {
  CareerApplicationDto,
  QueryCareerApplicationsDto,
  UpdateCareerApplicationDto,
} from './dto/career-application.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('careers')
@Controller('career-applications')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class CareerApplicationsController {
  constructor(private readonly careersService: CareersService) {}

  @Get()
  @ApiOperation({ summary: 'List all applications across careers (admin)' })
  @ApiOkResponse({ type: [CareerApplicationDto] })
  findAll(@Query() query: QueryCareerApplicationsDto) {
    return this.careersService.findAllApplications(query);
  }

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

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application (admin)' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  remove(@Param('id') id: string) {
    return this.careersService.removeApplication(id);
  }
}
