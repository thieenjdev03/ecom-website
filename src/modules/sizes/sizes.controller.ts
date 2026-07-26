import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SizesService } from './sizes.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { SizeDto } from './dto/size-response.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('sizes')
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a size / packaging (admin)' })
  @ApiCreatedResponse({ type: SizeDto })
  create(@Body() dto: CreateSizeDto) {
    return this.sizesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sizes / packaging, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOkResponse({ type: [SizeDto] })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.sizesService.findAll(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a size by id' })
  @ApiParam({ name: 'id', description: 'Size UUID' })
  @ApiOkResponse({ type: SizeDto })
  @ApiResponse({ status: 404, description: 'Size not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sizesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a size / packaging (admin)' })
  @ApiParam({ name: 'id', description: 'Size UUID' })
  @ApiOkResponse({ type: SizeDto })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateSizeDto) {
    return this.sizesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a size (admin)' })
  @ApiParam({ name: 'id', description: 'Size UUID' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sizesService.remove(id);
  }
}
