import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AssignProductsDto } from './dto/assign-products.dto';
import { QueryCollectionDto } from './dto/query-collection.dto';
import { HomepageQueryDto, HomepageSectionDto } from './dto/homepage-section.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collections with cursor pagination' })
  @ApiResponse({ status: 200, description: 'Collections retrieved successfully' })
  findAll(@Query() query: QueryCollectionDto) {
    return this.collectionsService.findAll(query);
  }

  @Get('homepage')
  @ApiOperation({
    summary: 'Get homepage sections (active collections with a homepage_section) each with product tiles',
  })
  @ApiResponse({ status: 200, description: 'Homepage sections retrieved successfully', type: [HomepageSectionDto] })
  getHomepageSections(@Query() query: HomepageQueryDto) {
    return this.collectionsService.getHomepageSections(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by ID' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection found' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get collection by slug' })
  @ApiParam({ name: 'slug', description: 'Collection slug' })
  @ApiResponse({ status: 200, description: 'Collection found' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products in a collection with cursor pagination' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  getProducts(@Param('id') id: string, @Query() query: QueryCollectionDto) {
    return this.collectionsService.getProducts(id, query);
  }

  @Get(':id/products/count')
  @ApiOperation({ summary: 'Get count of products in a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Product count retrieved' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  getProductCount(@Param('id') id: string) {
    return this.collectionsService.getProductCount(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(@Param('id') id: string, @Body() updateCollectionDto: UpdateCollectionDto) {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 204, description: 'Collection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }

  @Post(':id/products')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign products to a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Products assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product IDs' })
  @ApiResponse({ status: 404, description: 'Collection or products not found' })
  assignProducts(@Param('id') id: string, @Body() assignProductsDto: AssignProductsDto) {
    return this.collectionsService.assignProducts(id, assignProductsDto);
  }

  @Delete(':id/products')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove products from a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Products removed successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  removeProducts(@Param('id') id: string, @Body() assignProductsDto: AssignProductsDto) {
    return this.collectionsService.removeProducts(id, assignProductsDto);
  }
}

