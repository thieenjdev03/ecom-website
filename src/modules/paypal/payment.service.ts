import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { PaypalEvent } from './entities/paypal-event.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(PaypalEvent)
    private paypalEventRepository: Repository<PaypalEvent>,
    private mailService: MailService,
  ) {}

  async handleCaptureCompleted(resource: any): Promise<void> {
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const transactionId = resource?.id;
    // Keep original string value from PayPal for consistency, or parse and format
    const amountValue = resource?.amount?.value || '0.00';
    const amount = parseFloat(amountValue);
    const paidAmount = parseFloat(amountValue).toFixed(2); // Format as string with 2 decimals
    const currency = resource?.amount?.currency_code;

    this.logger.log(`💰 Capture Completed: Order ${orderId}, Transaction ${transactionId}, Amount ${amount} ${currency}`);

    try {
      // ✅ 1. Check for duplicate event (idempotency)
      const existingEvent = await this.paypalEventRepository.findOne({
        where: { eventId: resource.id },
      });

      if (existingEvent) {
        this.logger.warn(`⚠️ Duplicate event ignored: ${resource.id}`);
        return;
      }

      // ✅ 2. Create event record for tracking
      await this.paypalEventRepository.save({
        eventId: resource.id,
        orderId,
        type: 'PAYMENT.CAPTURE.COMPLETED',
        amount,
        currency,
        status: resource.status,
        rawData: resource,
        processingNotes: 'Payment captured successfully',
      });

      // ✅ 3. Update order status
      const updateResult = await this.orderRepository.update(
        { paypalOrderId: orderId },
        {
          status: 'PAID',
          paypalTransactionId: transactionId,
          paidAmount: paidAmount, // String with 2 decimals
          paidCurrency: currency,
          paidAt: new Date(),
        },
      );

      if (updateResult.affected === 0) {
        this.logger.warn(`⚠️ No order found with PayPal Order ID: ${orderId}`);
        return;
      }

      // ✅ 4. Get order details for email
      const order = await this.orderRepository.findOne({
        where: { paypalOrderId: orderId },
        relations: ['user', 'shippingAddress'],
      });

      if (order) {
        // ✅ 5. Send payment confirmation email
        await this.sendPaymentSuccessEmail(order, amount, currency, transactionId);

        // ✅ 6. Additional business logic can be added here
        // e.g., inventory management, subscription activation, etc.
        await this.processOrderAfterPayment(order);

        this.logger.log(`✅ Order ${orderId} marked as PAID and processed successfully`);
      }
    } catch (error) {
      this.logger.error(`❌ Error processing capture completed for order ${orderId}:`, error);
      
      // Log the error in the event record
      await this.paypalEventRepository.save({
        eventId: resource.id,
        orderId,
        type: 'PAYMENT.CAPTURE.COMPLETED',
        amount,
        currency,
        status: resource.status,
        rawData: resource,
        processingNotes: `Error processing: ${error.message}`,
      });
      
      throw error;
    }
  }

  async handleCaptureDenied(resource: any): Promise<void> {
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const transactionId = resource?.id;

    this.logger.warn(`❌ Capture Denied: Order ${orderId}, Transaction ${transactionId}`);

    try {
      // Check for duplicate event
      const existingEvent = await this.paypalEventRepository.findOne({
        where: { eventId: resource.id },
      });

      if (existingEvent) {
        this.logger.warn(`⚠️ Duplicate event ignored: ${resource.id}`);
        return;
      }

      // Create event record
      await this.paypalEventRepository.save({
        eventId: resource.id,
        orderId,
        type: 'PAYMENT.CAPTURE.DENIED',
        status: resource.status,
        rawData: resource,
        processingNotes: 'Payment capture was denied',
      });

      // Update order status
      await this.orderRepository.update(
        { paypalOrderId: orderId },
        {
          status: 'FAILED',
          paypalTransactionId: transactionId,
        },
      );

      this.logger.warn(`❌ Order ${orderId} marked as FAILED due to denied capture`);
    } catch (error) {
      this.logger.error(`❌ Error processing capture denied for order ${orderId}:`, error);
      throw error;
    }
  }

  async handleCaptureRefunded(resource: any): Promise<void> {
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const transactionId = resource?.id;
    const amount = parseFloat(resource?.amount?.value);
    const currency = resource?.amount?.currency_code;

    this.logger.log(`💸 Capture Refunded: Order ${orderId}, Transaction ${transactionId}, Amount ${amount} ${currency}`);

    try {
      // Check for duplicate event
      const existingEvent = await this.paypalEventRepository.findOne({
        where: { eventId: resource.id },
      });

      if (existingEvent) {
        this.logger.warn(`⚠️ Duplicate event ignored: ${resource.id}`);
        return;
      }

      // Create event record
      await this.paypalEventRepository.save({
        eventId: resource.id,
        orderId,
        type: 'PAYMENT.CAPTURE.REFUNDED',
        amount,
        currency,
        status: resource.status,
        rawData: resource,
        processingNotes: 'Payment was refunded',
      });

      // Update order status
      await this.orderRepository.update(
        { paypalOrderId: orderId },
        {
          status: 'REFUNDED',
          paypalTransactionId: transactionId,
        },
      );

      this.logger.log(`💸 Order ${orderId} marked as REFUNDED`);
    } catch (error) {
      this.logger.error(`❌ Error processing capture refunded for order ${orderId}:`, error);
      throw error;
    }
  }

  private async sendPaymentSuccessEmail(
    order: Order,
    amount: number,
    currency: string,
    transactionId?: string,
  ): Promise<void> {
    try {
      await this.mailService.sendEmail({
        to: order.user.email,
        subject: `Order ${order.orderNumber} confirmed`,
        template: 'paid-order-confirmation',
        data: {
          orderNumber: order.orderNumber,
          customerName: [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email,
          amount,
          currency,
          items: order.items,
          summary: order.summary,
          shippingAddress: order.shippingAddress,
          paidAt: order.paidAt || new Date(),
          transactionId,
        },
      });
      this.logger.log(`📧 Payment confirmation email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send payment confirmation email for order ${order.orderNumber}:`, error);
      // Don't throw error - email failure shouldn't break the payment process
    }
  }

  async updateOrderWithPaypalOrderId(orderId: string, paypalOrderId: string): Promise<void> {
    try {
      const updateResult = await this.orderRepository.update(
        { id: orderId },
        { paypalOrderId }
      );

      if (updateResult.affected === 0) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      this.logger.log(`✅ Updated order ${orderId} with PayPal order ID ${paypalOrderId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update order ${orderId} with PayPal order ID:`, error);
      throw error;
    }
  }

  private async processOrderAfterPayment(order: Order): Promise<void> {
    try {
      // Additional business logic after successful payment
      // e.g., inventory management, subscription activation, etc.
      
      this.logger.log(`🔄 Processing post-payment logic for order ${order.orderNumber}`);
      
      // Example: Update inventory
      // await this.updateInventory(order.items);
      
      // Example: Activate subscription
      // await this.subscriptionService.activatePlan(order.id);
      
      this.logger.log(`✅ Post-payment processing completed for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Error in post-payment processing for order ${order.orderNumber}:`, error);
      // Don't throw error - post-payment processing failure shouldn't affect the payment
    }
  }
}
