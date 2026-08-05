import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionsService } from './collections.service';
import { Collection } from './entities/collection.entity';
import { ProductCollection } from './entities/product-collection.entity';
import { Product } from '../products/entities/product.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionsRepository: Repository<Collection>;
  let productCollectionsRepository: Repository<ProductCollection>;
  let productsRepository: Repository<Product>;

  const mockCollectionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProductCollectionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockProductsRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: getRepositoryToken(Collection),
          useValue: mockCollectionsRepository,
        },
        {
          provide: getRepositoryToken(ProductCollection),
          useValue: mockProductCollectionsRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    collectionsRepository = module.get<Repository<Collection>>(getRepositoryToken(Collection));
    productCollectionsRepository = module.get<Repository<ProductCollection>>(getRepositoryToken(ProductCollection));
    productsRepository = module.get<Repository<Product>>(getRepositoryToken(Product));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a collection with auto-generated slug', async () => {
      const createDto = {
        name: 'Summer Collection',
        description: 'Summer fashion items',
      };

      const mockCollection = {
        id: '123',
        name: 'Summer Collection',
        slug: 'summer-collection',
        description: 'Summer fashion items',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCollectionsRepository.findOne.mockResolvedValue(null);
      mockCollectionsRepository.create.mockReturnValue(mockCollection);
      mockCollectionsRepository.save.mockResolvedValue(mockCollection);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCollection);
      expect(mockCollectionsRepository.create).toHaveBeenCalled();
      expect(mockCollectionsRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto = {
        name: 'Summer Collection',
        slug: 'summer-collection',
      };

      mockCollectionsRepository.findOne.mockResolvedValue({ id: '123', slug: 'summer-collection' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a collection by id', async () => {
      const mockCollection = {
        id: '123',
        name: 'Test Collection',
        slug: 'test-collection',
      };

      mockCollectionsRepository.findOne.mockResolvedValue(mockCollection);

      const result = await service.findOne('123');

      expect(result).toEqual(mockCollection);
      expect(mockCollectionsRepository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockCollectionsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignProducts', () => {
    it('should assign products to collection', async () => {
      const collectionId = '123';
      const assignDto = {
        productIds: ['prod1', 'prod2'],
      };

      const mockCollection = { id: collectionId, name: 'Test' };
      const mockProducts = [
        { id: 'prod1', name: 'Product 1' },
        { id: 'prod2', name: 'Product 2' },
      ];

      mockCollectionsRepository.findOne.mockResolvedValue(mockCollection);
      mockProductsRepository.find.mockResolvedValue(mockProducts);
      mockProductCollectionsRepository.find.mockResolvedValue([]);
      mockProductCollectionsRepository.create.mockImplementation((data) => data);
      mockProductCollectionsRepository.save.mockResolvedValue([]);

      const result = await service.assignProducts(collectionId, assignDto);

      expect(result.added).toBe(2);
      expect(result.skipped).toBe(0);
    });

    it('should skip already assigned products', async () => {
      const collectionId = '123';
      const assignDto = {
        productIds: ['prod1', 'prod2'],
      };

      const mockCollection = { id: collectionId, name: 'Test' };
      const mockProducts = [
        { id: 'prod1', name: 'Product 1' },
        { id: 'prod2', name: 'Product 2' },
      ];
      const existingAssignment = [{ product_id: 'prod1', collection_id: collectionId }];

      mockCollectionsRepository.findOne.mockResolvedValue(mockCollection);
      mockProductsRepository.find.mockResolvedValue(mockProducts);
      mockProductCollectionsRepository.find.mockResolvedValue(existingAssignment);
      mockProductCollectionsRepository.create.mockImplementation((data) => data);
      mockProductCollectionsRepository.save.mockResolvedValue([]);

      const result = await service.assignProducts(collectionId, assignDto);

      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe('getHomepageSections', () => {
    it('should return active sections with locale-resolved product tiles and total count', async () => {
      const mockCollection = {
        id: 'col1',
        name: 'Must Try',
        slug: 'must-try',
        description: 'Editor picks',
        homepage_section: 'must_try',
        is_active: true,
        created_at: new Date(),
      };

      const mockProduct = {
        id: 'prod1',
        name: { en: 'Green Tea', vi: 'Trà Xanh' },
        slug: { en: 'green-tea', vi: 'tra-xanh' },
        short_description: { en: 'Fresh', vi: 'Tươi' },
        price: '10.00',
        sale_price: '8.50',
        images: ['a.jpg', 'b.jpg'],
        stock_quantity: 5,
        status: 'active',
        is_featured: true,
        enable_sale_tag: true,
        created_at: new Date(),
      };

      const collectionsQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCollection]),
      };
      const productsQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockCollectionsRepository.createQueryBuilder.mockReturnValue(collectionsQb);
      mockProductsRepository.createQueryBuilder.mockReturnValue(productsQb);
      mockProductCollectionsRepository.count.mockResolvedValue(12);

      const result = await service.getHomepageSections({ limit: 8, locale: 'vi' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'col1',
        homepage_section: 'must_try',
        product_count: 12,
      });
      expect(result[0].products[0]).toEqual({
        id: 'prod1',
        name: 'Trà Xanh',
        slug: 'tra-xanh',
        short_description: 'Tươi',
        price: 10,
        sale_price: 8.5,
        image: 'a.jpg',
        images: ['a.jpg', 'b.jpg'],
        stock_quantity: 5,
        status: 'active',
        is_featured: true,
        enable_sale_tag: true,
      });
    });

    it('should return an empty array when no active sections exist', async () => {
      const collectionsQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockCollectionsRepository.createQueryBuilder.mockReturnValue(collectionsQb);

      const result = await service.getHomepageSections({});

      expect(result).toEqual([]);
    });
  });

  describe('getProductCount', () => {
    it('should return product count for collection', async () => {
      const collectionId = '123';
      const mockCollection = { id: collectionId, name: 'Test' };

      mockCollectionsRepository.findOne.mockResolvedValue(mockCollection);
      mockProductCollectionsRepository.count.mockResolvedValue(5);

      const result = await service.getProductCount(collectionId);

      expect(result).toBe(5);
      expect(mockProductCollectionsRepository.count).toHaveBeenCalledWith({
        where: { collection_id: collectionId },
      });
    });
  });
});

