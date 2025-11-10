import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Validate required fields
      this.validateCreateOrderDto(createOrderDto);

      // Validate user exists
      const user = await this.userRepository.findOne({ where: { id: createOrderDto.userId } });
      if (!user) {
        throw new BadRequestException(`User with ID ${createOrderDto.userId} not found. Please provide a valid user ID.`);
      }

      // Validate shipping address if provided
      if (createOrderDto.shippingAddressId) {
        const shippingAddress = await this.addressRepository.findOne({
          where: { id: createOrderDto.shippingAddressId, userId: createOrderDto.userId },
        });
        if (!shippingAddress) {
          throw new BadRequestException(
            `Shipping address with ID ${createOrderDto.shippingAddressId} not found or does not belong to user ${createOrderDto.userId}.`
          );
        }
      }

      // Validate billing address if provided
      if (createOrderDto.billingAddressId) {
        const billingAddress = await this.addressRepository.findOne({
          where: { id: createOrderDto.billingAddressId, userId: createOrderDto.userId },
        });
        if (!billingAddress) {
          throw new BadRequestException(
            `Billing address with ID ${createOrderDto.billingAddressId} not found or does not belong to user ${createOrderDto.userId}.`
          );
        }
      }

      // Validate: either shippingAddressId or shipping_address should be provided, but not both
      if (createOrderDto.shipping_address && createOrderDto.shippingAddressId) {
        throw new BadRequestException(
          'Cannot provide both shippingAddressId and shipping_address. Please provide only one option.'
        );
      }

      // Generate unique order number
      const orderNumber = this.generateOrderNumber();

      // Handle shipping_address object - format it into notes if provided
      let notes = createOrderDto.notes || '';
      if (createOrderDto.shipping_address && !createOrderDto.shippingAddressId) {
        const addr = createOrderDto.shipping_address;
        const addressText = `Shipping Address: ${addr.full_name}, ${addr.phone}, ${addr.address_line}${addr.city ? `, ${addr.city}` : ''}${addr.district ? `, ${addr.district}` : ''}${addr.ward ? `, ${addr.ward}` : ''}`;
        notes = notes ? `${notes}\n${addressText}` : addressText;
      }

      // Map DTO to Entity format
      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        orderNumber,
        status: 'PENDING',
        paymentMethod: createOrderDto.paymentMethod || 'PAYPAL',
        items: createOrderDto.items,
        summary: createOrderDto.summary,
        shippingAddressId: createOrderDto.shippingAddressId,
        billingAddressId: createOrderDto.billingAddressId,
        notes: notes,
      });

      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`Order created successfully: ${savedOrder.orderNumber} for user ${savedOrder.userId}`);
      return savedOrder;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      
      // Handle database errors
      if (error.code === '23503') {
        // Foreign key violation
        throw new BadRequestException('Invalid reference: One or more referenced resources do not exist.');
      }
      if (error.code === '23505') {
        // Unique violation
        throw new BadRequestException('Order number already exists. Please try again.');
      }

      throw new BadRequestException(`Failed to create order: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async findAll(userId?: string, status?: string): Promise<Order[]> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress');

    if (userId) {
      queryBuilder.where('order.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'shippingAddress', 'billingAddress'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Enrich items with product thumbnail URLs
    if (order.items && order.items.length > 0) {
      try {
        // Validate UUID format and filter out invalid IDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const productIds = order.items
          .map(item => item.productId)
          .filter((id) => {
            const isValid = uuidRegex.test(id);
            if (!isValid) {
              this.logger.warn(`Invalid productId format in order ${order.orderNumber}: "${id}". Skipping thumbnail fetch for this product.`);
            }
            return isValid;
          })
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

        if (productIds.length > 0) {
          const products = await this.productRepository.find({
            where: { id: In(productIds) },
            select: ['id', 'images'],
          });

          const productMap = new Map(products.map(p => [p.id, p]));

          // Add productThumbnailUrl to each item
          order.items = order.items.map(item => {
            // Skip if productId is not a valid UUID
            if (!uuidRegex.test(item.productId)) {
              return {
                ...item,
                productThumbnailUrl: null,
              };
            }

            const product = productMap.get(item.productId);
            const thumbnailUrl = product?.images && product.images.length > 0 
              ? product.images[0] 
              : null;
            
            return {
              ...item,
              productThumbnailUrl: thumbnailUrl,
            };
          });
        } else {
          // No valid UUIDs found, set all thumbnails to null
          this.logger.warn(`No valid product UUIDs found in order ${order.orderNumber}. All product thumbnails will be null.`);
          order.items = order.items.map(item => ({
            ...item,
            productThumbnailUrl: null,
          }));
        }
      } catch (error) {
        // Log error but don't fail the entire request
        this.logger.error(`Failed to fetch product thumbnails for order ${order.orderNumber}: ${error.message}`, error.stack);
        
        // Set all thumbnails to null on error
        order.items = order.items.map(item => ({
          ...item,
          productThumbnailUrl: null,
        }));
      }
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['user', 'shippingAddress', 'billingAddress'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async findByPaypalOrderId(paypalOrderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { paypalOrderId },
      relations: ['user', 'shippingAddress', 'billingAddress'],
    });

    if (!order) {
      throw new NotFoundException(`Order with PayPal ID ${paypalOrderId} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.findOne(id);

      // Validate status transitions
      if (updateOrderDto.status && !this.isValidStatusTransition(order.status, updateOrderDto.status)) {
        const validTransitions = this.getValidStatusTransitions(order.status);
        throw new BadRequestException(
          `Invalid status transition from "${order.status}" to "${updateOrderDto.status}". ` +
          `Valid transitions from "${order.status}" are: ${validTransitions.join(', ')}.`
        );
      }

      // Validate payment method if provided
      if (updateOrderDto.paymentMethod && !['PAYPAL', 'STRIPE', 'COD'].includes(updateOrderDto.paymentMethod)) {
        throw new BadRequestException(
          `Invalid payment method "${updateOrderDto.paymentMethod}". Valid options are: PAYPAL, STRIPE, COD.`
        );
      }

      Object.assign(order, updateOrderDto);
      const updatedOrder = await this.orderRepository.save(order);
      this.logger.log(`Order updated successfully: ${updatedOrder.orderNumber}`);
      return updatedOrder;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to update order ${id}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update order: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId },
      relations: ['shippingAddress', 'billingAddress'],
      order: { createdAt: 'DESC' },
    });
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
  }

  /**
   * Validate CreateOrderDto with detailed error messages
   */
  private validateCreateOrderDto(dto: CreateOrderDto): void {
    // Validate items array
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item. Please add items to your order.');
    }

    // Validate each item
    dto.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim().length === 0) {
        throw new BadRequestException(`Item ${index + 1}: Product ID is required and must be a valid UUID.`);
      }
      if (!item.productName || item.productName.trim().length === 0) {
        throw new BadRequestException(`Item ${index + 1}: Product name is required.`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException(`Item ${index + 1}: Quantity must be greater than 0.`);
      }
      if (!item.unitPrice || !/^\d+\.\d{2}$/.test(item.unitPrice)) {
        throw new BadRequestException(
          `Item ${index + 1}: Unit price must be a string with exactly two decimal places (e.g., "29.99").`
        );
      }
      if (!item.totalPrice || !/^\d+\.\d{2}$/.test(item.totalPrice)) {
        throw new BadRequestException(
          `Item ${index + 1}: Total price must be a string with exactly two decimal places (e.g., "59.98").`
        );
      }
    });

    // Validate summary
    if (!dto.summary) {
      throw new BadRequestException('Order summary is required. Please provide order summary with pricing details.');
    }

    const summary = dto.summary;
    const requiredSummaryFields = ['subtotal', 'shipping', 'tax', 'discount', 'total', 'currency'];
    const missingFields = requiredSummaryFields.filter(field => !summary[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Order summary is missing required fields: ${missingFields.join(', ')}. Please provide all summary fields.`
      );
    }

    // Validate summary price formats
    const priceFields = ['subtotal', 'shipping', 'tax', 'discount', 'total'];
    for (const field of priceFields) {
      if (!/^\d+\.\d{2}$/.test(summary[field])) {
        throw new BadRequestException(
          `Summary ${field} must be a string with exactly two decimal places (e.g., "72.57").`
        );
      }
    }

    if (!summary.currency || summary.currency.trim().length === 0) {
      throw new BadRequestException('Currency is required in order summary.');
    }

    // Validate shipping address if provided
    if (dto.shipping_address) {
      const addr = dto.shipping_address;
      if (!addr.full_name || addr.full_name.trim().length === 0) {
        throw new BadRequestException('Shipping address: Full name is required.');
      }
      if (!addr.phone || addr.phone.trim().length === 0) {
        throw new BadRequestException('Shipping address: Phone number is required.');
      }
      if (!addr.address_line || addr.address_line.trim().length === 0) {
        throw new BadRequestException('Shipping address: Address line is required.');
      }
    }

    // Validate that at least one shipping option is provided
    if (!dto.shippingAddressId && !dto.shipping_address) {
      throw new BadRequestException(
        'Shipping information is required. Please provide either shippingAddressId or shipping_address object.'
      );
    }
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PAID', 'CANCELLED', 'FAILED'],
      'PAID': ['PROCESSING', 'CANCELLED', 'REFUNDED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': ['REFUNDED'],
      'CANCELLED': [],
      'FAILED': ['PENDING'],
      'REFUNDED': [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PAID', 'CANCELLED', 'FAILED'],
      'PAID': ['PROCESSING', 'CANCELLED', 'REFUNDED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': ['REFUNDED'],
      'CANCELLED': [],
      'FAILED': ['PENDING'],
      'REFUNDED': [],
    };

    return validTransitions[currentStatus] || [];
  }
}
