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
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { HomepageBannersService } from './homepage-banners.service';
import { CreateHomepageBannerDto } from './dto/create-homepage-banner.dto';
import { UpdateHomepageBannerDto } from './dto/update-homepage-banner.dto';
import { QueryHomepageBannerDto } from './dto/query-homepage-banner.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('homepage')
@Controller('homepage/banners')
export class HomepageBannersController {
  constructor(private readonly bannersService: HomepageBannersService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a hero banner (admin)' })
  @ApiResponse({ status: 201, description: 'Banner created' })
  create(@Body() dto: CreateHomepageBannerDto) {
    return this.bannersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List hero banners, ordered by display_order (?active=true for the storefront)' })
  @ApiResponse({ status: 200, description: 'Banners retrieved successfully' })
  findAll(@Query() query: QueryHomepageBannerDto) {
    return this.bannersService.findAll(query);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a hero banner (admin)' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateHomepageBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a hero banner (admin)' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  @ApiResponse({ status: 204, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bannersService.remove(id);
  }
}
