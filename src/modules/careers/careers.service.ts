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
import {
  ApplyCareerDto,
  UpdateCareerApplicationDto,
  QueryCareerApplicationsDto as QueryAllApplicationsDto,
} from './dto/career-application.dto';
import { FilesService } from '../files/files.service';
import { MailService } from '../mail/mail.service';
import { renderMingoEmail, mingoBrandFromEnv, MINGO, MINGO_FONT } from '../../common/email/mingo-email';
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
    private mailService: MailService,
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
    while (await this.careersRepository.findOne({ where: { slug } })) {
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
    await this.careersRepository.remove(career);
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

    const saved = await this.applicationsRepository.save(
      this.applicationsRepository.create({
        career_id: career.id,
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        cover_letter: dto.cover_letter ?? null,
        cv_url: uploaded.url,
      }),
    );

    const inbox = process.env.CONTACT_INBOX_EMAIL?.trim();

    // 1) Báo nội bộ tới hộp thư chung của hệ thống (nếu đã cấu hình).
    if (inbox) {
      try {
        await this.mailService.sendEmail({
          to: inbox,
          // Reply-To = email ứng viên, bấm "Trả lời" là trả thẳng cho họ.
          replyTo: saved.email,
          subject: `[Ứng tuyển] ${career.title} — ${saved.full_name}`,
          html: this.buildApplicationNotificationEmail(saved, career.title),
        });
      } catch (error) {
        this.logger.error(`Không gửi được mail thông báo ứng tuyển nội bộ ${saved.id}`, error as Error);
      }
    } else {
      this.logger.warn('CONTACT_INBOX_EMAIL chưa cấu hình — đơn ứng tuyển chỉ được lưu DB, không báo nội bộ');
    }

    // 2) Gửi mail xác nhận cho chính ứng viên (độc lập với mail nội bộ).
    try {
      await this.mailService.sendEmail({
        to: saved.email,
        replyTo: inbox,
        subject: 'Mingo đã nhận được đơn ứng tuyển của bạn',
        html: this.buildApplicationAcknowledgementEmail(saved, career.title),
      });
    } catch (error) {
      this.logger.error(`Không gửi được mail xác nhận ứng tuyển cho ứng viên ${saved.id}`, error as Error);
    }

    return saved;
  }

  /** Mail xác nhận gửi lại cho ứng viên — khớp design brand Mingo. */
  private buildApplicationAcknowledgementEmail(application: CareerApplication, careerTitle: string): string {
    const content = `
      <p style="margin:0 0 18px;font-size:16px;color:${MINGO.brown};">Chào <strong>${escapeHtml(application.full_name)}</strong>,</p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MINGO.brown};">
        Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <strong>${escapeHtml(careerTitle)}</strong> tại Mingo!
        Hệ thống đã ghi nhận hồ sơ của bạn và chuyển trực tiếp đến bộ phận tuyển dụng.
      </p>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${MINGO.brown};">
        Đội ngũ Mingo sẽ xem xét hồ sơ và phản hồi qua email này hoặc số điện thoại
        <strong>${escapeHtml(application.phone)}</strong> nếu hồ sơ của bạn phù hợp với vị trí đang tuyển.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.7;color:${MINGO.brown};">
        Chúc bạn may mắn!
      </p>
    `;

    return renderMingoEmail(mingoBrandFromEnv(), {
      title: 'Mingo đã nhận được đơn ứng tuyển của bạn',
      preheader: `Cảm ơn ${application.full_name}, Mingo đã ghi nhận đơn ứng tuyển vị trí ${careerTitle}.`,
      content,
    });
  }

  /** Mail báo nội bộ khi có đơn ứng tuyển mới. */
  private buildApplicationNotificationEmail(application: CareerApplication, careerTitle: string): string {
    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;color:${MINGO.muted};font-size:13px;width:150px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:${MINGO.brown};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`;

    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Ứng tuyển mới</p>
      <h1 style="margin:0 0 18px;font-family:${MINGO_FONT};font-size:24px;font-weight:800;color:${MINGO.brown};">${escapeHtml(careerTitle)}</h1>
      <table style="width:100%;border-collapse:collapse;">
        ${row('Họ tên', application.full_name)}
        ${row('Email', application.email)}
        ${row('Số điện thoại', application.phone)}
        ${row('Thời gian', application.created_at.toLocaleString('vi-VN'))}
      </table>
      ${application.cover_letter
        ? `<div style="margin-top:20px;padding:16px;background:${MINGO.ivory};border-left:3px solid ${MINGO.orange};color:${MINGO.brown};font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(application.cover_letter)}</div>`
        : ''}
      <p style="margin-top:20px;">
        <a href="${application.cv_url}" style="color:${MINGO.orange};font-weight:600;">Xem CV đính kèm</a>
      </p>
    `;

    return renderMingoEmail(mingoBrandFromEnv(), {
      title: `Ứng tuyển mới - ${careerTitle}`,
      preheader: `${application.full_name} · ${application.email}`,
      content,
    });
  }

  async findApplications(careerId: string): Promise<CareerApplication[]> {
    await this.findOne(careerId);
    return this.applicationsRepository.find({
      where: { career_id: careerId },
      order: { created_at: 'DESC' },
    });
  }

  /** Admin: list all applications across careers, with filters + offset pagination. */
  async findAllApplications(
    query: QueryAllApplicationsDto,
  ): Promise<{ data: CareerApplication[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, career_id, search } = query;

    const qb = this.applicationsRepository
      .createQueryBuilder('app')
      // Only pull the career title for display — avoids shipping the full job content HTML.
      .leftJoin('app.career', 'career')
      .addSelect(['career.id', 'career.title', 'career.slug'])
      .orderBy('app.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('app.status = :status', { status });
    if (career_id) qb.andWhere('app.career_id = :career_id', { career_id });
    if (search) {
      qb.andWhere('(app.full_name ILIKE :search OR app.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
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

  async removeApplication(id: string): Promise<void> {
    const application = await this.applicationsRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application with ID "${id}" not found`);
    }
    await this.applicationsRepository.remove(application);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
