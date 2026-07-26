import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';
import { PolicyDto } from './dto/policy-response.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('policies-admin')
@Controller('admin/policies')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a policy (admin)' })
  @ApiCreatedResponse({ type: PolicyDto })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() dto: CreatePolicyDto) {
    return this.policiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List policies ordered by display_order (admin)' })
  @ApiOkResponse({ type: [PolicyDto] })
  findAll(@Query() query: QueryPolicyDto) {
    return this.policiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a policy by id (admin)' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiOkResponse({ type: PolicyDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a policy (admin)' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiOkResponse({ type: PolicyDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.policiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a policy (admin)' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}
