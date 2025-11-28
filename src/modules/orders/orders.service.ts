import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, ShippingAddressDto, UpdateOrderDto } from './dto/order.dto';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Product } from '../products/entities/product.entity';
import { AddressesService } from '../addresses/addresses.service';
import { UpdateAddressDto } from '../addresses/dto/update-address.dto';
import { OrderStatus } from './enums/order-status.enum';

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
    private readonly addressesService: AddressesService,
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

      // Normalize shipping address payload by syncing user address if necessary
      let notes = createOrderDto.notes || '';
      let shippingAddressId = createOrderDto.shippingAddressId;
      if (createOrderDto.shipping_address && !shippingAddressId) {
        const syncedAddress = await this.addressesService.upsertByUser(
          createOrderDto.userId,
          this.mapShippingPayloadToAddressDto(createOrderDto.shipping_address),
        );
        shippingAddressId = syncedAddress.id;

        const addr = createOrderDto.shipping_address;
        const addressText = `Shipping Address: ${addr.full_name}, ${addr.phone}, ${addr.address_line}${addr.city ? `, ${addr.city}` : ''}${addr.district ? `, ${addr.district}` : ''}${addr.ward ? `, ${addr.ward}` : ''}`;
        notes = notes ? `${notes}\n${addressText}` : addressText;
      }

      // Map DTO to Entity format
      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        orderNumber,
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: createOrderDto.paymentMethod || 'PAYPAL',
        items: createOrderDto.items,
        summary: createOrderDto.summary,
        shippingAddressId,
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

    await this.populateProductThumbnails(order);

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
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['shippingAddress', 'billingAddress'],
      order: { createdAt: 'DESC' },
    });

    await this.populateProductThumbnails(orders);

    return orders;
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
      if (!addr.province || addr.province.trim().length === 0) {
        throw new BadRequestException('Shipping address: Province is required.');
      }
      if (!addr.district || addr.district.trim().length === 0) {
        throw new BadRequestException('Shipping address: District is required.');
      }
      if (!addr.countryCode || addr.countryCode.trim().length !== 2) {
        throw new BadRequestException('Shipping address: countryCode must be provided as ISO alpha-2 code.');
      }
    }

    // Validate that at least one shipping option is provided
    if (!dto.shippingAddressId && !dto.shipping_address) {
      throw new BadRequestException(
        'Shipping information is required. Please provide either shippingAddressId or shipping_address object.'
      );
    }
  }

  private readonly fulfillmentFlow: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.PACKED,
    OrderStatus.READY_TO_GO,
    OrderStatus.AT_CARRIER_FACILITY,
    OrderStatus.IN_TRANSIT,
    OrderStatus.ARRIVED_IN_COUNTRY,
    OrderStatus.AT_LOCAL_FACILITY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ];

  private readonly overrideTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    [OrderStatus.PROCESSING]: [OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.FAILED]: [OrderStatus.PENDING_PAYMENT],
  };

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return this.getValidStatusTransitions(currentStatus).includes(newStatus);
  }

  private getValidStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const sequentialNext = this.getNextSequentialStatus(currentStatus);
    const overrideStatuses = this.overrideTransitions[currentStatus] ?? [];
    const candidates = sequentialNext ? [sequentialNext, ...overrideStatuses] : overrideStatuses;
    return Array.from(new Set(candidates));
  }

  private getNextSequentialStatus(currentStatus: OrderStatus): OrderStatus | null {
    const index = this.fulfillmentFlow.indexOf(currentStatus);
    if (index === -1 || index === this.fulfillmentFlow.length - 1) {
      return null;
    }
    return this.fulfillmentFlow[index + 1];
  }

  /**
   * Populate productThumbnailUrl for order items by fetching product images
   */
  private async populateProductThumbnails(orderOrOrders: Order | Order[]): Promise<void> {
    const orders = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (!orders.length) {
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIdSet = new Set<string>();

    orders.forEach(order => {
      if (!order.items || order.items.length === 0) {
        return;
      }

      order.items.forEach(item => {
        if (!item.productId || !uuidRegex.test(item.productId)) {
          this.logger.warn(
            `Invalid or missing productId in order ${order.orderNumber}: "${item.productId ?? 'undefined'}". Skipping thumbnail fetch for this item.`
          );
          return;
        }

        productIdSet.add(item.productId);
      });
    });

    if (productIdSet.size === 0) {
      orders.forEach(order => {
        if (!order.items || order.items.length === 0) {
          return;
        }

        order.items = order.items.map(item => ({
          ...item,
          productThumbnailUrl: null,
        }));
      });
      return;
    }

    try {
      const products = await this.productRepository.find({
        where: { id: In(Array.from(productIdSet)) },
        select: ['id', 'images'],
      });

      const productMap = new Map(products.map(product => [product.id, product]));

      orders.forEach(order => {
        if (!order.items || order.items.length === 0) {
          return;
        }

        order.items = order.items.map(item => {
          if (!item.productId || !uuidRegex.test(item.productId)) {
            return {
              ...item,
              productThumbnailUrl: null,
            };
          }

          const product = productMap.get(item.productId);
          const thumbnailUrl = product?.images && product.images.length > 0 ? product.images[0] : null;

          return {
            ...item,
            productThumbnailUrl: thumbnailUrl,
          };
        });
      });
    } catch (error) {
      this.logger.error(`Failed to fetch product thumbnails for orders list: ${error.message}`, error.stack);
      orders.forEach(order => {
        if (!order.items || order.items.length === 0) {
          return;
        }

        order.items = order.items.map(item => ({
          ...item,
          productThumbnailUrl: null,
        }));
      });
    }
  }

  private mapShippingPayloadToAddressDto(payload: ShippingAddressDto): UpdateAddressDto {
    return {
      recipientName: payload.full_name,
      recipientPhone: payload.phone,
      label: payload.label ?? 'Checkout',
      countryCode: payload.countryCode,
      province: payload.province,
      district: payload.district,
      ward: payload.ward ?? payload.city,
      streetLine1: payload.address_line,
      streetLine2: payload.address_line2,
      postalCode: payload.postalCode,
      note: payload.note,
      isShipping: true,
      isBilling: payload.isBilling ?? false,
      isDefault: payload.isDefault ?? true,
    };
  }
}
