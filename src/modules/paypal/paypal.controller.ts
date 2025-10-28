import { Controller, Post, Req, Res, HttpCode, Body } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import axios from 'axios';
// @ts-ignore - PayPal SDK types may not be fully compatible
import paypal = require('@paypal/checkout-server-sdk');
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

interface PayPalWebhookEvent {
  event_type: string;
  resource: any;
  [key: string]: any;
}

interface CreateOrderDto {
  value?: string;
  currency?: string;
  description?: string;
}

@ApiTags('PayPal')
@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('create-order')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create PayPal order for checkout' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  @ApiResponse({ status: 500, description: 'Error creating order' })
  @ApiBody({
    description: 'Order details',
    schema: {
      type: 'object',
      properties: {
        value: { type: 'string', example: '29.99', description: 'Payment amount' },
        currency: { type: 'string', example: 'USD', description: 'Currency code' },
        description: { type: 'string', example: 'Product purchase', description: 'Order description' },
      },
    },
  })
  async createOrder(@Body() body: CreateOrderDto, @Res() res: any) {
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
      const order = await client.execute(request);

      // Find the approve link
      const approveLink = order.result.links.find((l: any) => l.rel === 'approve');
      
      return res.json({
        success: true,
        orderId: order.result.id,
        approveUrl: approveLink?.href,
        status: order.result.status,
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


  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle PayPal webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 400, description: 'Webhook verification failed' })
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

