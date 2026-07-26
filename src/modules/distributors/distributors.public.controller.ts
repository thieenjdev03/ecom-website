import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DistributorsService } from './distributors.service';
import { QueryDistributorDto } from './dto/query-distributor.dto';
import { DistributorDto, DistributorListDto } from './dto/distributor-response.dto';

@ApiTags('distributors')
@Controller('distributors')
export class DistributorsPublicController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  @ApiOperation({ summary: 'List active distributors with filters + pagination' })
  @ApiOkResponse({ type: DistributorListDto })
  findAll(@Query() query: QueryDistributorDto) {
    return this.distributorsService.findAll({ ...query, is_active: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active distributor by id' })
  @ApiParam({ name: 'id', description: 'Distributor UUID' })
  @ApiOkResponse({ type: DistributorDto })
  @ApiResponse({ status: 404, description: 'Distributor not found' })
  async findOne(@Param('id') id: string) {
    const distributor = await this.distributorsService.findOne(id);
    if (!distributor.is_active) {
      throw new NotFoundException(`Distributor ${id} not found`);
    }
    return distributor;
  }
}
