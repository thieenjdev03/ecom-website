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
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, ChangeOrderStatusDto, StatusHistoryItemDto } from './dto/order.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order with items and payment details' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        id: 'order-uuid',
        orderNumber: 'ORD-20250101-1234',
        userId: 'user-uuid',
        status: 'PENDING_PAYMENT',
        paymentMethod: 'PAYPAL',
        items: [
          {
            productId: 1,
            productName: 'Premium T-Shirt',
            productSlug: 'premium-t-shirt',
            variantId: 'variant-123',
            variantName: 'Red - Large',
            quantity: 2,
            unitPrice: '29.99',
            totalPrice: '59.98',
            sku: 'TSH-001-RED-L',
          },
        ],
        summary: {
          subtotal: '59.98',
          shipping: '5.99',
          tax: '6.60',
          discount: '0.00',
          total: '72.57',
          currency: 'USD',
        },
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get orders (Admin: all orders, User: own orders only)' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    schema: {
      example: [
        {
          id: 'order-uuid',
          orderNumber: 'ORD-20250101-1234',
          status: 'PAID',
          paymentMethod: 'PAYPAL',
          paypalOrderId: '6S5011234B5562345',
          paypalTransactionId: '3GG57250SL7328348',
          paidAmount: '72.57',
          paidCurrency: 'USD',
          paidAt: '2025-01-01T10:05:00Z',
          user: {},
          items: [],
          summary: {},
          createdAt: '2025-01-01T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID (Admin only)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    const currentUserId = req.user?.sub || req.user?.userId;
    const userRole = req.user?.role;
    
    // If user is not ADMIN, only show their own orders
    if (userRole !== Role.ADMIN) {
      return await this.ordersService.findAll(currentUserId, status);
    }
    
    // ADMIN can see all orders or filter by userId
    return await this.ordersService.findAll(userId, status);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  async getMyOrders(@Request() req) {
    console.log('req.user check getMyOrders', req.user);
    const userId = req.user?.sub || req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    return await this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    schema: {
      example: {
        id: 'order-uuid',
        orderNumber: 'ORD-20250101-1234',
        status: 'PAID',
        paymentMethod: 'PAYPAL',
        paypalOrderId: '6S5011234B5562345',
        paypalTransactionId: '3GG57250SL7328348',
        paidAmount: '72.57',
        paidCurrency: 'USD',
        paidAt: '2025-01-01T10:05:00Z',
        items: [],
        summary: {},
        shippingAddress: {},
        billingAddress: {},
        createdAt: '2025-01-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return await this.ordersService.findByOrderNumber(orderNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
    schema: {
      example: {
        id: 'order-uuid',
        orderNumber: 'ORD-20250101-1234',
        status: 'READY_TO_GO',
        trackingNumber: '1Z999AA1234567890',
        carrier: 'UPS',
        internalNotes: 'Customer requested expedited shipping',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return await this.ordersService.update(id, updateOrderDto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Change order status with tracking history (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status changed successfully',
    schema: {
      example: {
        id: 'order-uuid',
        orderNumber: 'ORD-20250101-1234',
        status: 'PACKED',
        tracking_history: [
          {
            from_status: 'PROCESSING',
            to_status: 'PACKED',
            changed_at: '2025-01-01T01:00:00.000Z',
            changed_by: 'ADMIN',
            note: 'Order packed at warehouse',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async changeStatus(
    @Param('id') id: string,
    @Body() changeOrderStatusDto: ChangeOrderStatusDto,
    @Request() req,
  ) {
    const changedBy = req.user?.id || req.user?.sub || req.user?.userId || 'SYSTEM';
    return await this.ordersService.changeOrderStatus(id, changeOrderStatusDto, changedBy);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get order status history with duration tracking' })
  @ApiResponse({
    status: 200,
    description: 'Status history retrieved successfully',
    schema: {
      example: [
        {
          from_status: 'PAID',
          to_status: 'PROCESSING',
          changed_at: '2025-01-01T01:00:00Z',
          changed_by: 'ADMIN',
          duration_seconds: 3600,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatusHistory(@Param('id') id: string): Promise<StatusHistoryItemDto[]> {
    return await this.ordersService.getStatusHistory(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Order deleted successfully',
    schema: {
      example: {
        message: 'Order deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
    return { message: 'Order deleted successfully' };
  }
}
