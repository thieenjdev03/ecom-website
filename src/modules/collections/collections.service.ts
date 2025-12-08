import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { ProductCollection } from './entities/product-collection.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AssignProductsDto } from './dto/assign-products.dto';
import { QueryCollectionDto } from './dto/query-collection.dto';
import { 
  decodeCursor, 
  buildCursorResponse, 
  CursorPaginatedResponse,
  CursorData
} from './helpers/cursor-pagination.helper';

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
    @InjectRepository(ProductCollection)
    private productCollectionsRepository: Repository<ProductCollection>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  /**
   * Generate slug from name if not provided
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Create a new collection
   */
  async create(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    try {
      // Auto-generate slug if not provided
      if (!createCollectionDto.slug) {
        createCollectionDto.slug = this.generateSlug(createCollectionDto.name);
      }

      // Check slug uniqueness
      const existingSlug = await this.collectionsRepository.findOne({
        where: { slug: createCollectionDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Collection with slug "${createCollectionDto.slug}" already exists`);
      }

      const collection = this.collectionsRepository.create(createCollectionDto);
      return await this.collectionsRepository.save(collection);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create collection: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create collection');
    }
  }

  /**
   * Get all collections with cursor-based pagination
   */
  async findAll(query: QueryCollectionDto): Promise<CursorPaginatedResponse<Collection>> {
    try {
      const { limit = 20, cursor } = query;
      
      const queryBuilder = this.collectionsRepository
        .createQueryBuilder('collection')
        .orderBy('collection.created_at', 'DESC')
        .addOrderBy('collection.id', 'DESC')
        .take(limit + 1); // Fetch one extra to check if there's a next page

      // Apply cursor pagination if cursor is provided
      if (cursor) {
        const decodedCursor = decodeCursor(cursor);
        
        if (!decodedCursor) {
          throw new BadRequestException('Invalid cursor token');
        }

        // Use tuple comparison: (created_at, id) < (cursor.created_at, cursor.id)
        queryBuilder.where(
          `(collection.created_at, collection.id) < (:created_at, :id)`,
          {
            created_at: decodedCursor.created_at,
            id: decodedCursor.id,
          }
        );
      }

      const collections = await queryBuilder.getMany();

      return buildCursorResponse(
        collections,
        limit,
        (item) => ({
          id: item.id,
          created_at: item.created_at,
        })
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch collections: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch collections');
    }
  }

  /**
   * Get a single collection by ID
   */
  async findOne(id: string): Promise<Collection> {
    const collection = await this.collectionsRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID "${id}" not found`);
    }

    return collection;
  }

  /**
   * Get a collection by slug
   */
  async findBySlug(slug: string): Promise<Collection> {
    const collection = await this.collectionsRepository.findOne({
      where: { slug },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with slug "${slug}" not found`);
    }

    return collection;
  }

  /**
   * Update a collection
   */
  async update(id: string, updateCollectionDto: UpdateCollectionDto): Promise<Collection> {
    try {
      const collection = await this.findOne(id);

      // Check slug uniqueness if slug is being updated
      if (updateCollectionDto.slug && updateCollectionDto.slug !== collection.slug) {
        const existingSlug = await this.collectionsRepository.findOne({
          where: { slug: updateCollectionDto.slug },
        });

        if (existingSlug) {
          throw new ConflictException(`Collection with slug "${updateCollectionDto.slug}" already exists`);
        }
      }

      Object.assign(collection, updateCollectionDto);
      return await this.collectionsRepository.save(collection);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update collection: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update collection');
    }
  }

  /**
   * Delete a collection
   */
  async remove(id: string): Promise<void> {
    const collection = await this.findOne(id);
    await this.collectionsRepository.remove(collection);
  }

  /**
   * Assign products to a collection
   */
  async assignProducts(id: string, assignProductsDto: AssignProductsDto): Promise<{ added: number; skipped: number }> {
    try {
      const collection = await this.findOne(id);
      const { productIds } = assignProductsDto;

      // Verify all products exist
      const products = await this.productsRepository.find({
        where: { id: In(productIds) },
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Products not found: ${missingIds.join(', ')}`);
      }

      // Check which products are already assigned
      const existingAssignments = await this.productCollectionsRepository.find({
        where: {
          collection_id: id,
          product_id: In(productIds),
        },
      });

      const existingProductIds = existingAssignments.map(pa => pa.product_id);
      const newProductIds = productIds.filter(pid => !existingProductIds.includes(pid));

      // Create new assignments
      const newAssignments = newProductIds.map(productId =>
        this.productCollectionsRepository.create({
          product_id: productId,
          collection_id: id,
        })
      );

      if (newAssignments.length > 0) {
        await this.productCollectionsRepository.save(newAssignments);
      }

      return {
        added: newAssignments.length,
        skipped: existingProductIds.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to assign products: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to assign products to collection');
    }
  }

  /**
   * Remove products from a collection
   */
  async removeProducts(id: string, assignProductsDto: AssignProductsDto): Promise<{ removed: number }> {
    try {
      const collection = await this.findOne(id);
      const { productIds } = assignProductsDto;

      // Find existing assignments
      const assignments = await this.productCollectionsRepository.find({
        where: {
          collection_id: id,
          product_id: In(productIds),
        },
      });

      if (assignments.length === 0) {
        return { removed: 0 };
      }

      await this.productCollectionsRepository.remove(assignments);

      return { removed: assignments.length };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to remove products: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove products from collection');
    }
  }

  /**
   * Get products in a collection with cursor-based pagination
   */
  async getProducts(
    id: string,
    query: QueryCollectionDto
  ): Promise<CursorPaginatedResponse<Product>> {
    try {
      const collection = await this.findOne(id);
      const { limit = 20, cursor } = query;

      const queryBuilder = this.productsRepository
        .createQueryBuilder('product')
        .innerJoin(
          'product_collections',
          'pc',
          'pc.product_id = product.id AND pc.collection_id = :collectionId',
          { collectionId: id }
        )
        .leftJoinAndSelect('product.category', 'category')
        .where('product.deleted_at IS NULL')
        .orderBy('product.created_at', 'DESC')
        .addOrderBy('product.id', 'DESC')
        .take(limit + 1); // Fetch one extra to check if there's a next page

      // Apply cursor pagination if cursor is provided
      if (cursor) {
        const decodedCursor = decodeCursor(cursor);
        
        if (!decodedCursor) {
          throw new BadRequestException('Invalid cursor token');
        }

        // Use tuple comparison: (created_at, id) < (cursor.created_at, cursor.id)
        queryBuilder.andWhere(
          `(product.created_at, product.id) < (:created_at, :id)`,
          {
            created_at: decodedCursor.created_at,
            id: decodedCursor.id,
          }
        );
      }

      const products = await queryBuilder.getMany();

      return buildCursorResponse(
        products,
        limit,
        (item) => ({
          id: item.id,
          created_at: item.created_at,
        })
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch products: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch products for collection');
    }
  }

  /**
   * Get count of products in a collection
   */
  async getProductCount(id: string): Promise<number> {
    await this.findOne(id); // Verify collection exists

    return await this.productCollectionsRepository.count({
      where: { collection_id: id },
    });
  }
}

