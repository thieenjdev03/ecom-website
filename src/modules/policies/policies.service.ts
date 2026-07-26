import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as sanitizeHtml from 'sanitize-html';
import { Policy } from './entities/policy.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's',
    'a', 'br', 'hr', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
};

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private policiesRepository: Repository<Policy>,
  ) {}

  private sanitize(html: string): string {
    return sanitizeHtml(html, SANITIZE_OPTIONS);
  }

  private baseSlug(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Slug unique: append -2, -3, ... on collision. */
  private async generateUniqueSlug(source: string, ignoreId?: string): Promise<string> {
    const base = this.baseSlug(source) || 'policy';
    let slug = base;
    let i = 2;
    // eslint-disable-next-line no-await-in-loop
    while (true) {
      const existing = await this.policiesRepository.findOne({ where: { slug }, withDeleted: true });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${base}-${i++}`;
    }
  }

  async create(dto: CreatePolicyDto): Promise<Policy> {
    const slug = await this.generateUniqueSlug(dto.slug || dto.title);
    const policy = this.policiesRepository.create({
      title: dto.title,
      slug,
      content: this.sanitize(dto.content),
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
    });
    return this.policiesRepository.save(policy);
  }

  /** Admin list — full rows, ordered for the sidebar. */
  async findAll(query: QueryPolicyDto): Promise<Policy[]> {
    const qb = this.policiesRepository
      .createQueryBuilder('policy')
      .orderBy('policy.display_order', 'ASC')
      .addOrderBy('policy.created_at', 'ASC');

    if (query.search) qb.andWhere('policy.title ILIKE :search', { search: `%${query.search}%` });
    if (typeof query.is_active === 'boolean') {
      qb.andWhere('policy.is_active = :is_active', { is_active: query.is_active });
    }

    return qb.getMany();
  }

  /** Public list — active only, lightweight (title/slug for the sidebar). */
  async findActive(): Promise<Policy[]> {
    return this.policiesRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC', created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policiesRepository.findOne({ where: { id } });
    if (!policy) throw new NotFoundException(`Policy with ID "${id}" not found`);
    return policy;
  }

  async findBySlug(slug: string): Promise<Policy> {
    const policy = await this.policiesRepository.findOne({ where: { slug } });
    if (!policy) throw new NotFoundException(`Policy with slug "${slug}" not found`);
    return policy;
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id);

    if (dto.slug !== undefined && dto.slug !== policy.slug) {
      const existing = await this.policiesRepository.findOne({
        where: { slug: dto.slug },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Policy with slug "${dto.slug}" already exists`);
      }
      policy.slug = dto.slug || (await this.generateUniqueSlug(dto.title || policy.title, id));
    }

    if (dto.title !== undefined) policy.title = dto.title;
    if (dto.content !== undefined) policy.content = this.sanitize(dto.content);
    if (dto.display_order !== undefined) policy.display_order = dto.display_order;
    if (dto.is_active !== undefined) policy.is_active = dto.is_active;

    return this.policiesRepository.save(policy);
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id);
    await this.policiesRepository.softRemove(policy);
  }
}
