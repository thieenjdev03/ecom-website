import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (Admin Management)' })
  @ApiResponse({ status: 200, description: 'Fetched categories successfully' })
  async getCategories(
    @Query('with_children_count') withChildrenCount?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const count = withChildrenCount === 'true' || withChildrenCount === '1';
    const categories = await this.categoriesService.findAllForAdmin(count);

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url,
      parent: cat.parent?.id ?? null,
      parent_name: cat.parent?.name ?? 'Root Category',
      display_order: cat.display_order ?? 0,
      is_active: cat.is_active,
      status: cat.is_active ? 'Active' : 'Inactive',
      children_count: count ? (cat.children?.length ?? 0) : undefined,
      created_at: cat.created_at,
      created_at_display: formatDateTime(cat.created_at),
    }));

    return {
      success: true,
      message: 'Fetched categories successfully',
      data,
      meta: {
        total: categories.length,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : categories.length,
      },
    };
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get Category Tree (Frontend Navigation)' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  async getTree(@Query('active') active?: string) {
    const onlyActive = active === 'true' || active === '1';
    const roots = await this.categoriesService.findTree(onlyActive);
    return roots.map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      description: parent.description,
      image_url: parent.image_url,
      children: (parent.children ?? [])
        .filter((c) => (onlyActive ? c.is_active : true))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((c) => ({ 
          id: c.id, 
          name: c.name, 
          slug: c.slug,
          description: c.description,
          image_url: c.image_url,
        })),
    }));
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active categories only' })
  @ApiResponse({ status: 200, description: 'Active categories retrieved' })
  findActive() {
    return this.categoriesService.findActive();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

function formatDateTime(date: Date | string | undefined) {
  if (!date) return undefined;
  const d = new Date(date);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
