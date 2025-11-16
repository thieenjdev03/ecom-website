import { Controller, Post, Req, Res, HttpCode, Body, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaypalService } from './paypal.service';
import { PaymentService } from './payment.service';
import { Order } from '../orders/entities/order.entity';
import axios from 'axios';
// @ts-ignore - PayPal SDK types may not be fully compatible
import paypal = require('@paypal/checkout-server-sdk');
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

interface PayPalWebhookEvent {
  event_type: string;
  resource: any;
  [key: string]: any;
}

class CreatePaypalOrderDto {
  @ApiProperty({ description: 'Order ID (UUID) - optional, for linking PayPal order to database order', example: 'dbe05153-f288-4b0c-b73d-bcfe37e4f117' })
  @IsOptional()
  @IsUUID(4, { message: 'order_id must be a valid UUID v4' })
  order_id?: string;

  @ApiProperty({ description: 'Payment amount', example: '72.57' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Order description', example: 'Order #ORD-20250101-1234' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

class CaptureOrderDto {
  @ApiProperty({ description: 'PayPal order ID - optional if provided in URL', example: '6S5011234B5562345', required: false })
  @IsString()
  @IsOptional()
  paypalOrderId?: string;

  @ApiProperty({ description: 'Order ID (UUID) - optional, can be found by paypalOrderId', example: 'order-uuid', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}

@ApiTags('PayPal')
@Controller('paypal')
export class PaypalController {
  constructor(
    private readonly paypalService: PaypalService,
    private readonly paymentService: PaymentService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Post('create-order')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a new PayPal order' })
  @ApiResponse({
    status: 200,
    description: 'Order created successfully',
    schema: {
      example: {
        success: true,
        orderId: '6S5011234B5562345',
        approveUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=6S5011234B5562345',
        status: 'CREATED',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Error creating order' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createOrder(@Body() body: CreatePaypalOrderDto, @Res() res: any) {
    const client = this.paypalService.getClient();

    try {
      // Initialize orders create request
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: body.currency || 'USD',
              value: body.value || '5.00',
            },
            description: body.description || 'Product purchase',
          },
        ],
      });

      // Execute request to PayPal
      const paypalOrder = await client.execute(request);

      // Find the approve link
      const approveLink = paypalOrder.result.links.find((l: any) => l.rel === 'approve');
      
      // If order_id is provided, update the database order with PayPal order ID
      if (body.order_id) {
        try {
          await this.paymentService.updateOrderWithPaypalOrderId(
            body.order_id,
            paypalOrder.result.id
          );
        } catch (err) {
          // Log error but don't fail the request - PayPal order is already created
          console.error('⚠️ Failed to update order with PayPal order ID:', err.message);
        }
      }
      
      return res.json({
        success: true,
        orderId: paypalOrder.result.id,
        approveUrl: approveLink?.href,
        status: paypalOrder.result.status,
      });
    } catch (err) {
      console.error('❌ Create order error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: err.message,
      });
    }
  }

  @Post('capture-order/:paypalOrderId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Capture PayPal order after customer approval' })
  @ApiResponse({
    status: 200,
    description: 'Order captured successfully',
    schema: {
      example: {
        success: true,
        status: 'COMPLETED',
        orderId: 'order-uuid-string',
        orderNumber: 'ORD-20250101-1234',
        paypalOrderId: '6S5011234B5562345',
        paypalTransactionId: '3GG57250SL7328348',
        paidAmount: '72.57',
        currency: 'USD',
        paidAt: '2025-01-01T10:05:00Z',
        payer: {
          email: 'buyer@example.com',
          name: {
            given_name: 'John',
            surname: 'Doe',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 500, description: 'Error capturing order' })
  async captureOrder(
    @Param('paypalOrderId') paypalOrderId: string,
    @Res() res: any,
    @Body() body?: CaptureOrderDto,
  ) {
    const client = this.paypalService.getClient();

    try {
      // Use paypalOrderId from URL parameter or from body
      const paypalOrderIdToUse = paypalOrderId || body?.paypalOrderId;
      
      if (!paypalOrderIdToUse) {
        return res.status(400).json({
          success: false,
          message: 'PayPal order ID is required',
        });
      }

      // Initialize orders capture request
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderIdToUse);
      request.requestBody({});

      // Execute request to PayPal
      const capture = await client.execute(request);

      // Get capture details
      const captureId = capture.result.purchase_units[0]?.payments?.captures?.[0]?.id;
      const captureAmount = capture.result.purchase_units[0]?.payments?.captures?.[0]?.amount?.value;
      const captureCurrency = capture.result.purchase_units[0]?.payments?.captures?.[0]?.amount?.currency_code;
      const captureStatus = capture.result.purchase_units[0]?.payments?.captures?.[0]?.status;

      // Extract payer information from PayPal response
      const payer = capture.result.payer;
      const payerInfo = payer
        ? {
            email: payer.email_address,
            name: payer.name
              ? {
                  given_name: payer.name.given_name,
                  surname: payer.name.surname,
                }
              : undefined,
          }
        : undefined;

      // Fetch order from database to get orderId and orderNumber
      // Try to find by paypalOrderId first, then by orderId from body
      let order = await this.orderRepository.findOne({
        where: { paypalOrderId: paypalOrderIdToUse },
      });

      if (!order && body?.orderId) {
        order = await this.orderRepository.findOne({
          where: { id: body.orderId },
        });
      }

      // Prepare response data
      const responseData: any = {
        success: true,
        status: captureStatus,
        paypalOrderId: paypalOrderIdToUse,
        paypalTransactionId: captureId,
        paidAmount: captureAmount,
        currency: captureCurrency,
        paidAt: new Date().toISOString(),
      };

      // Add order information if found (High Priority - Required)
      if (order) {
        responseData.orderId = order.id;
        responseData.orderNumber = order.orderNumber;
      }

      // Add payer information if available (Low Priority - Optional)
      if (payerInfo) {
        responseData.payer = payerInfo;
      }

      if (captureStatus === 'COMPLETED') {
        // Update order in database
        await this.paymentService.handleCaptureCompleted({
          id: captureId,
          amount: { value: captureAmount, currency_code: captureCurrency },
          status: captureStatus,
          supplementary_data: {
            related_ids: { order_id: paypalOrderIdToUse },
          },
        });

        // Re-fetch order after update to ensure we have the latest data
        if (!order) {
          order = await this.orderRepository.findOne({
            where: { paypalOrderId: paypalOrderIdToUse },
          });
          if (order) {
            responseData.orderId = order.id;
            responseData.orderNumber = order.orderNumber;
          }
        }
      }

      return res.json(responseData);
    } catch (err) {
      console.error('❌ Capture order error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error capturing order',
        error: err.message,
      });
    }
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle PayPal webhook events (Internal)' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully (PayPal requires 200 to stop retries)' })
  @ApiResponse({ status: 400, description: 'Webhook verification failed' })
  @ApiBody({
    description: 'PayPal webhook event',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'WH-4JK59271PC8770311-9D517218GS861580D' },
        event_type: { type: 'string', example: 'PAYMENT.CAPTURE.COMPLETED' },
        resource: { type: 'object' },
      },
    },
  })
  async handleWebhook(@Req() req, @Res() res) {
    const headers = req.headers;

    // ✅ Nếu body là buffer (do bodyParser.raw), cần parse thủ công
    const event =
      typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString())
        : req.body;
  
    console.log('🧾 VERIFY PAYLOAD', {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      event_id: event?.id,
    });
  
    try {
      const verifyRes = await axios.post(
        'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature',
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event, // ✅ JSON object thật sự
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(
                `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
              ).toString('base64'),
          },
        },
      );
  
      console.log('verifyRes', verifyRes.data);
      if (verifyRes.data.verification_status === 'SUCCESS') {
        console.log(`✅ Verified webhook: ${event.event_type}`);
        
        // Process the webhook event
        const eventType = event.event_type;
        const resource = event.resource;

        try {
          switch (eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
              await this.paymentService.handleCaptureCompleted(resource);
              break;

            case 'PAYMENT.CAPTURE.DENIED':
              await this.paymentService.handleCaptureDenied(resource);
              break;

            case 'PAYMENT.CAPTURE.REFUNDED':
              await this.paymentService.handleCaptureRefunded(resource);
              break;

            default:
              console.log('Unhandled PayPal event:', eventType);
          }
        } catch (error) {
          console.error('❌ Error processing webhook event:', error);
          // Still return 200 to PayPal to prevent retries
        }
      } else {
        console.warn('⚠️ Webhook verification failed:', verifyRes.data);
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('❌ Webhook verification error:', err.response?.data || err);
      res.status(400).send('Error');
    }
  }
}

