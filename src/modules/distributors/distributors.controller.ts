import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { DistributorsService } from './distributors.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';
import { QueryDistributorDto } from './dto/query-distributor.dto';
import { DistributorDto, DistributorListDto } from './dto/distributor-response.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('distributors-admin')
@Controller('admin/distributors')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a distributor (admin)' })
  @ApiCreatedResponse({ type: DistributorDto })
  @ApiResponse({ status: 400, description: 'Invalid maps embed URL or unknown category/collection id' })
  create(@Body() dto: CreateDistributorDto) {
    return this.distributorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List distributors with filters + pagination (admin)' })
  @ApiOkResponse({ type: DistributorListDto })
  findAll(@Query() query: QueryDistributorDto) {
    return this.distributorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a distributor by id (admin)' })
  @ApiParam({ name: 'id', description: 'Distributor UUID' })
  @ApiOkResponse({ type: DistributorDto })
  @ApiResponse({ status: 404, description: 'Distributor not found' })
  findOne(@Param('id') id: string) {
    return this.distributorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a distributor (admin)' })
  @ApiParam({ name: 'id', description: 'Distributor UUID' })
  @ApiOkResponse({ type: DistributorDto })
  @ApiResponse({ status: 404, description: 'Distributor not found' })
  update(@Param('id') id: string, @Body() dto: UpdateDistributorDto) {
    return this.distributorsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a distributor (admin)' })
  @ApiParam({ name: 'id', description: 'Distributor UUID' })
  @ApiResponse({ status: 404, description: 'Distributor not found' })
  remove(@Param('id') id: string) {
    return this.distributorsService.remove(id);
  }
}
