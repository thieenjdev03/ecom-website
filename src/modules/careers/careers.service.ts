import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as sanitizeHtml from 'sanitize-html';
import { Career } from './entities/career.entity';
import { CareerApplication } from './entities/career-application.entity';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { QueryCareerDto } from './dto/query-career.dto';
import { ApplyCareerDto, UpdateCareerApplicationDto } from './dto/career-application.dto';
import { FilesService } from '../files/files.service';
import {
  decodeCursor,
  buildCursorResponse,
  CursorPaginatedResponse,
} from '../collections/helpers/cursor-pagination.helper';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
};

@Injectable()
export class CareersService {
  private readonly logger = new Logger(CareersService.name);

  constructor(
    @InjectRepository(Career)
    private careersRepository: Repository<Career>,
    @InjectRepository(CareerApplication)
    private applicationsRepository: Repository<CareerApplication>,
    private filesService: FilesService,
  ) {}

  private sanitize(html: string): string {
    return sanitizeHtml(html, SANITIZE_OPTIONS);
  }

  private baseSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /** Slug unique: append -1, -2, ... on collision. */
  private async generateUniqueSlug(title: string): Promise<string> {
    const base = this.baseSlug(title);
    let slug = base;
    let i = 1;
    // ponytail: sequential probe, fine for admin-rate writes
    while (await this.careersRepository.findOne({ where: { slug }, withDeleted: true })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  /** Resolve related careers, dropping self-reference and verifying existence. */
  private async resolveSubCareers(ids: string[], selfId?: string): Promise<Career[]> {
    const clean = [...new Set(ids)].filter((id) => id !== selfId);
    if (clean.length === 0) return [];
    const found = await this.careersRepository.findBy({ id: In(clean) });
    if (found.length !== clean.length) {
      throw new BadRequestException('Some related careers do not exist');
    }
    return found;
  }

  async create(dto: CreateCareerDto): Promise<Career> {
    if (dto.slug) {
      const existing = await this.careersRepository.findOne({
        where: { slug: dto.slug },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException(`Career with slug "${dto.slug}" already exists`);
      }
    }

    const { subCareerIds, ...rest } = dto;
    const career = this.careersRepository.create({
      ...rest,
      slug: dto.slug ?? (await this.generateUniqueSlug(dto.title)),
      content: this.sanitize(dto.content),
      published_at: dto.status === 'published' ? new Date() : null,
    });

    if (subCareerIds?.length) {
      career.subCareers = await this.resolveSubCareers(subCareerIds);
    }

    return this.careersRepository.save(career);
  }

  async findAll(query: QueryCareerDto): Promise<CursorPaginatedResponse<Career>> {
    const { limit = 20, cursor, category, location, level, status, search } = query;

    const qb = this.careersRepository
      .createQueryBuilder('career')
      .orderBy('career.created_at', 'DESC')
      .addOrderBy('career.id', 'DESC')
      .take(limit + 1);

    if (category) qb.andWhere('career.category = :category', { category });
    if (location) qb.andWhere('career.location = :location', { location });
    if (level) qb.andWhere('career.level = :level', { level });
    if (status) qb.andWhere('career.status = :status', { status });
    if (search) qb.andWhere('career.title ILIKE :search', { search: `%${search}%` });

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) throw new BadRequestException('Invalid cursor token');
      qb.andWhere('(career.created_at, career.id) < (:created_at, :id)', {
        created_at: decoded.created_at,
        id: decoded.id,
      });
    }

    const careers = await qb.getMany();
    return buildCursorResponse(careers, limit, (item) => ({
      id: item.id,
      created_at: item.created_at,
    }));
  }

  async findPrimary(): Promise<Career[]> {
    return this.careersRepository.find({
      where: { is_primary: true, status: 'published' },
      order: { published_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Career> {
    const career = await this.careersRepository.findOne({ where: { id } });
    if (!career) throw new NotFoundException(`Career with ID "${id}" not found`);
    return career;
  }

  async findBySlug(slug: string): Promise<Career> {
    const career = await this.careersRepository.findOne({
      where: { slug },
      relations: { subCareers: true },
    });
    if (!career) throw new NotFoundException(`Career with slug "${slug}" not found`);
    return career;
  }

  async update(id: string, dto: UpdateCareerDto): Promise<Career> {
    const career = await this.findOne(id);

    if (dto.slug && dto.slug !== career.slug) {
      const existing = await this.careersRepository.findOne({
        where: { slug: dto.slug },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException(`Career with slug "${dto.slug}" already exists`);
      }
    }

    const { subCareerIds, content, ...rest } = dto;
    Object.assign(career, rest);
    if (content !== undefined) career.content = this.sanitize(content);
    if (subCareerIds) career.subCareers = await this.resolveSubCareers(subCareerIds, id);
    if (dto.status === 'published' && !career.published_at) {
      career.published_at = new Date();
    }

    return this.careersRepository.save(career);
  }

  async remove(id: string): Promise<void> {
    const career = await this.findOne(id);
    await this.careersRepository.softRemove(career);
  }

  // ---- Applications ----

  private static readonly CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];
  private static readonly CV_MAX_BYTES = 5 * 1024 * 1024;

  private assertValidCv(file?: Express.Multer.File): Express.Multer.File {
    if (!file) throw new BadRequestException('CV file is required (form field "cv")');

    const ext = (file.originalname.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase();
    if (!CareersService.CV_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('CV must be a .pdf, .doc or .docx file');
    }
    if (file.size > CareersService.CV_MAX_BYTES) {
      throw new BadRequestException('CV must be 5MB or smaller');
    }
    return file;
  }

  async apply(
    careerId: string,
    dto: ApplyCareerDto,
    cv: Express.Multer.File | undefined,
  ): Promise<CareerApplication> {
    const career = await this.findOne(careerId);
    if (career.status !== 'published') {
      throw new BadRequestException('This job is not open for applications');
    }

    this.assertValidCv(cv);
    const uploaded = await this.filesService.uploadFile(cv!, {
      folder: 'careers/cv',
      resourceType: 'raw',
    });

    return this.applicationsRepository.save(
      this.applicationsRepository.create({
        career_id: career.id,
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        cover_letter: dto.cover_letter ?? null,
        cv_url: uploaded.url,
      }),
    );
  }

  async findApplications(careerId: string): Promise<CareerApplication[]> {
    await this.findOne(careerId);
    return this.applicationsRepository.find({
      where: { career_id: careerId },
      order: { created_at: 'DESC' },
    });
  }

  async updateApplication(
    id: string,
    dto: UpdateCareerApplicationDto,
  ): Promise<CareerApplication> {
    const application = await this.applicationsRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application with ID "${id}" not found`);
    }
    application.status = dto.status;
    return this.applicationsRepository.save(application);
  }
}
