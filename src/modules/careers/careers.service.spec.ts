import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { CareersService } from './careers.service';
import { Career } from './entities/career.entity';
import { CareerApplication } from './entities/career-application.entity';
import { CreateCareerDto } from './dto/create-career.dto';
import { FilesService } from '../files/files.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

// sanitize-html pulls ESM-only htmlparser2 that ts-jest can't transform, and
// its stripping is the library's own tested concern — mock to passthrough so
// these tests exercise only CareersService's own logic.
jest.mock('sanitize-html', () => (html: string) => html);

describe('CareersService', () => {
  let service: CareersService;
  let repo: any;
  let applicationsRepo: any;
  let filesService: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'new', ...x })),
      findOne: jest.fn(),
      findBy: jest.fn(),
    };
    applicationsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'app-1', created_at: new Date(), ...x })),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    filesService = { uploadFile: jest.fn().mockResolvedValue({ url: 'https://cdn/cv.pdf' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareersService,
        { provide: getRepositoryToken(Career), useValue: repo },
        { provide: getRepositoryToken(CareerApplication), useValue: applicationsRepo },
        { provide: FilesService, useValue: filesService },
      ],
    }).compile();

    service = module.get<CareersService>(CareersService);
  });

  it('auto-generates slug and sets published_at when status is published', async () => {
    repo.findOne.mockResolvedValue(null); // slug free
    const result = await service.create({
      title: 'Content Marketing',
      content: '<p>ok</p>',
      status: 'published',
    } as any);
    expect(result.slug).toBe('content-marketing');
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('leaves published_at null for draft', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.create({ title: 'X', content: 'c' } as any);
    expect(result.published_at).toBeNull();
  });

  it('rejects a slug that already exists', async () => {
    repo.findOne.mockResolvedValue({ id: 'x' });
    await expect(
      service.create({ title: 'X', content: 'c', slug: 'taken' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('drops self-reference and rejects unknown related careers', async () => {
    repo.findOne.mockResolvedValue({ id: 'me', slug: 's', content: 'x' });
    repo.findBy.mockResolvedValue([]); // 'other' not found
    await expect(
      service.update('me', { subCareerIds: ['me', 'other'] } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    // 'me' must have been filtered out of the In([...]) before the existence check
    const idsQueried = repo.findBy.mock.calls[0][0].id._value;
    expect(idsQueried).not.toContain('me');
    expect(idsQueried).toContain('other');
  });

  // The admin UI sends camelCase, older clients snake_case — both must survive
  // ValidationPipe's plainToInstance, or whitelist swallows the field silently.
  it.each([
    [{ isPrimary: true, coverUrl: 'https://cdn/c.png' }],
    [{ is_primary: true, cover_url: 'https://cdn/c.png' }],
  ])('accepts %o for is_primary/cover_url', (payload) => {
    const dto = plainToInstance(CreateCareerDto, { title: 'X', content: 'c', ...payload });
    expect(dto.is_primary).toBe(true);
    expect(dto.cover_url).toBe('https://cdn/c.png');
  });

  describe('apply', () => {
    const cv = (name: string, size = 1000) =>
      ({ originalname: name, size, buffer: Buffer.from('x') }) as any;

    beforeEach(() => {
      repo.findOne.mockResolvedValue({ id: 'c1', status: 'published' });
    });

    it('uploads the CV and stores the returned URL', async () => {
      const result = await service.apply(
        'c1',
        { full_name: 'A', email: 'a@b.c', phone: '090' } as any,
        cv('resume.pdf'),
      );
      expect(filesService.uploadFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resourceType: 'raw' }),
      );
      expect(result.cv_url).toBe('https://cdn/cv.pdf');
      expect(result.status).toBeUndefined(); // DB default 'new'
    });

    it.each([['resume.exe'], ['resume.pdf.zip'], ['resume']])(
      'rejects %s',
      async (name) => {
        await expect(
          service.apply('c1', { full_name: 'A', email: 'a@b.c', phone: '090' } as any, cv(name)),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it('rejects a CV over 5MB', async () => {
      await expect(
        service.apply(
          'c1',
          { full_name: 'A', email: 'a@b.c', phone: '090' } as any,
          cv('resume.pdf', 6 * 1024 * 1024),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a missing file', async () => {
      await expect(
        service.apply('c1', { full_name: 'A', email: 'a@b.c', phone: '090' } as any, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects applying to an unpublished job', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', status: 'draft' });
      await expect(
        service.apply('c1', { full_name: 'A', email: 'a@b.c', phone: '090' } as any, cv('a.pdf')),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAllApplications', () => {
    let qb: any;

    const application = (over: any = {}) => ({
      id: 'a1',
      career_id: 'c1',
      full_name: 'Nguyen Van A',
      email: 'a@b.c',
      phone: '090',
      cover_letter: null,
      cv_url: 'https://cdn/cv.pdf',
      status: 'new',
      created_at: new Date('2026-01-01'),
      career: { title: 'Frontend Dev', slug: 'frontend-dev' },
      ...over,
    });

    beforeEach(() => {
      qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([application()]),
      };
      applicationsRepo.createQueryBuilder = jest.fn(() => qb);
    });

    it('flattens the joined career onto each item', async () => {
      const res = await service.findAllApplications({});
      expect(res.items[0].career_title).toBe('Frontend Dev');
      expect(res.items[0].career_slug).toBe('frontend-dev');
      expect(res.nextCursor).toBeNull();
    });

    // A soft-deleted job must not make its applications vanish from the inbox.
    it('includes soft-deleted careers in the join', async () => {
      await service.findAllApplications({});
      expect(qb.withDeleted).toHaveBeenCalled();
    });

    it('applies status, career and search filters', async () => {
      await service.findAllApplications({ status: 'new', career_id: 'c1', search: 'nguyen' });
      const clauses = qb.andWhere.mock.calls.map((c: any[]) => c[0]).join(' | ');
      expect(clauses).toContain('app.status = :status');
      expect(clauses).toContain('app.career_id = :career_id');
      expect(clauses).toContain('ILIKE :search');
    });

    it('rejects a malformed cursor', async () => {
      await expect(
        service.findAllApplications({ cursor: 'not-base64-json' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns a nextCursor when there are more rows than the limit', async () => {
      qb.getMany.mockResolvedValue([
        application({ id: 'a1' }),
        application({ id: 'a2' }),
      ]);
      const res = await service.findAllApplications({ limit: 1 });
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });
  });
});
