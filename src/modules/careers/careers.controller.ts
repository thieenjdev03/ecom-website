import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CareersService } from './careers.service';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { QueryCareerDto } from './dto/query-career.dto';
import { CareerDto, CareerListDto } from './dto/career-response.dto';
import {
  ApplyCareerDto,
  CareerApplicationDto,
  CareerApplicationReceiptDto,
  UpdateCareerApplicationDto,
} from './dto/career-application.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('careers')
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a career (admin)' })
  @ApiResponse({ status: 201, description: 'Career created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() dto: CreateCareerDto) {
    return this.careersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List careers with filters + cursor pagination' })
  @ApiOkResponse({ type: CareerListDto })
  findAll(@Query() query: QueryCareerDto) {
    return this.careersService.findAll(query);
  }

  @Get('primary')
  @ApiOperation({ summary: 'List pinned/featured published careers' })
  @ApiOkResponse({ type: [CareerDto] })
  findPrimary() {
    return this.careersService.findPrimary();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get career detail by slug (with related careers)' })
  @ApiOkResponse({ type: CareerDto })
  @ApiParam({ name: 'slug' })
  @ApiResponse({ status: 404, description: 'Career not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.careersService.findBySlug(slug);
  }

  @Post(':id/apply')
  @UseInterceptors(
    FileInterceptor('cv', {
      // Hard memory guard only — the 5MB rule is enforced in the service so it
      // answers 400 instead of multer's 413.
      limits: { fileSize: 6 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Apply for a job (public)' })
  @ApiParam({ name: 'id', description: 'Career UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['full_name', 'email', 'phone', 'cv'],
      properties: {
        full_name: { type: 'string', example: 'Nguyen Van A' },
        email: { type: 'string', example: 'a@example.com' },
        phone: { type: 'string', example: '0901234567' },
        cover_letter: { type: 'string' },
        cv: { type: 'string', format: 'binary', description: '.pdf/.doc/.docx, max 5MB' },
      },
    },
  })
  @ApiCreatedResponse({ type: CareerApplicationReceiptDto })
  @ApiResponse({ status: 400, description: 'Invalid CV file or job not open' })
  @ApiResponse({ status: 404, description: 'Career not found' })
  async apply(
    @Param('id') id: string,
    @Body() dto: ApplyCareerDto,
    @UploadedFile() cv: Express.Multer.File,
  ): Promise<CareerApplicationReceiptDto> {
    const application = await this.careersService.apply(id, dto, cv);
    return { id: application.id, created_at: application.created_at };
  }

  @Get(':id/applications')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List applications for a job (admin)' })
  @ApiParam({ name: 'id', description: 'Career UUID' })
  @ApiOkResponse({ type: [CareerApplicationDto] })
  findApplications(@Param('id') id: string) {
    return this.careersService.findApplications(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a career (admin)' })
  @ApiParam({ name: 'id', description: 'Career UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateCareerDto) {
    return this.careersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a career (admin)' })
  @ApiParam({ name: 'id', description: 'Career UUID' })
  remove(@Param('id') id: string) {
    return this.careersService.remove(id);
  }
}
