import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private readonly defaultFromAddress: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not configured, email functionality disabled');
    }

    // Get from address from env or use Resend test domain for development
    // Resend test domain: onboarding@resend.dev (works without domain verification)
    this.defaultFromAddress = 
      this.configService.get<string>('MAIL_FROM') || 
      'E-commerce Store <noreply@talktodoc.online>';
    
    if (!this.configService.get<string>('MAIL_FROM')) {
      this.logger.warn('MAIL_FROM not configured, using Resend test domain: onboarding@resend.dev');
      this.logger.warn('For production, please set MAIL_FROM to a verified domain in Resend dashboard');
    }
  }

  /**
   * Generic email sender used across services
   * Accepts either direct HTML or a known template + data
   */
  async sendEmail(payload: {
    to: string;
    subject: string;
    html?: string;
    template?: 'payment-success' | 'order-confirmation' | 'password-reset' | 'welcome' | 'payment-failure';
    data?: any;
    from?: string;
  }): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email');
        return;
      }

      const fromAddress = payload.from || this.defaultFromAddress;

      let html = payload.html;
      if (!html && payload.template) {
        switch (payload.template) {
          case 'payment-success': {
            const { orderNumber, customerName, amount, currency, items, summary } = payload.data || {};
            html = this.generatePaymentSuccessHTML({
              customerName: customerName || 'Customer',
              orderNumber: orderNumber || 'N/A',
              amount: amount ?? 0,
              currency: currency || 'USD',
              items: items || [],
              summary: summary || {},
            });
            break;
          }
          case 'order-confirmation': {
            // Backward compatibility with existing generator
            const d = payload.data || {};
            html = this.generateOrderConfirmationHTML({
              customerName: d.customerName,
              orderId: d.orderId,
              orderTotal: d.orderTotal,
              currency: d.currency,
              items: d.items || [],
            });
            break;
          }
          case 'password-reset': {
            const { resetUrl } = payload.data || {};
            html = this.generatePasswordResetHTML(resetUrl || '#');
            break;
          }
          case 'welcome': {
            const { name } = payload.data || {};
            html = this.generateWelcomeHTML(name || 'Customer');
            break;
          }
          case 'payment-failure': {
            const { orderId, reason } = payload.data || {};
            html = this.generatePaymentFailureHTML(orderId || 'N/A', reason || 'Unknown');
            break;
          }
        }
      }

      if (!html) {
        html = '<p>No email content provided.</p>';
      }

      await this.resend.emails.send({
        from: fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html,
      });

      this.logger.log(`Email sent to ${payload.to} with subject: ${payload.subject}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   * @param orderData - Order information
   */
  async sendOrderConfirmation(orderData: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    orderTotal: number;
    currency: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email');
        return;
      }

      const { customerEmail, customerName, orderId, orderTotal, currency, items } = orderData;

      const emailContent = this.generateOrderConfirmationHTML({
        customerName,
        orderId,
        orderTotal,
        currency,
        items,
      });

      await this.resend.emails.send({
        from: this.defaultFromAddress,
        to: [customerEmail],
        subject: `Order Confirmation - #${orderId}`,
        html: emailContent,
      });

      this.logger.log(`Order confirmation email sent to ${customerEmail} for order ${orderId}`);
    } catch (error) {
      this.logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email - User email
   * @param resetToken - Password reset token
   */
  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email');
        return;
      }

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const emailContent = this.generatePasswordResetHTML(resetUrl);

      await this.resend.emails.send({
        from: this.defaultFromAddress,
        to: [email],
        subject: 'Password Reset Request',
        html: emailContent,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   * @param email - User email
   * @param name - User name
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email');
        return;
      }

      const emailContent = this.generateWelcomeHTML(name);

      await this.resend.emails.send({
        from: this.defaultFromAddress,
        to: [email],
        subject: 'Welcome to our store!',
        html: emailContent,
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Send payment failure notification
   * @param email - Customer email
   * @param orderId - Order ID
   * @param reason - Failure reason
   */
  async sendPaymentFailureNotification(
    email: string,
    orderId: string,
    reason: string,
  ): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email');
        return;
      }

      const emailContent = this.generatePaymentFailureHTML(orderId, reason);

      await this.resend.emails.send({
        from: this.defaultFromAddress,
        to: [email],
        subject: `Payment Failed - Order #${orderId}`,
        html: emailContent,
      });

      this.logger.log(`Payment failure notification sent to ${email} for order ${orderId}`);
    } catch (error) {
      this.logger.error('Failed to send payment failure notification:', error);
      throw error;
    }
  }

  /**
   * Generate order confirmation HTML
   */
  private generateOrderConfirmationHTML(data: {
    customerName: string;
    orderId: string;
    orderTotal: number;
    currency: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }): string {
    const itemsHTML = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price} ${data.currency}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Order Confirmation</h1>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your order! Your order #${data.orderId} has been confirmed.</p>
          
          <h2>Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <h3>Total: ${data.orderTotal} ${data.currency}</h3>
          </div>
          
          <p>We'll send you another email when your order ships.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment success HTML (used by PaymentService)
   */
  private generatePaymentSuccessHTML(data: {
    customerName: string;
    orderNumber: string;
    amount: number;
    currency: string;
    items: Array<{ name?: string; quantity?: number; price?: number }>;
    summary: any;
  }): string {
    const itemsHTML = (data.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name ?? ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity ?? ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price ?? ''} ${data.currency}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Payment Confirmed</h1>
          <p>Dear ${data.customerName},</p>
          <p>We have received your payment for order <strong>#${data.orderNumber}</strong>.</p>

          <h2>Payment Summary</h2>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>

          <h2>Order Items</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <h3>Total: ${data.summary?.total ?? data.amount} ${data.currency}</h3>
          </div>

          <p>We'll send another update when your order ships. Thank you for your purchase!</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset HTML
   */
  private generatePasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Password Reset Request</h1>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate welcome HTML
   */
  private generateWelcomeHTML(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Welcome to our store!</h1>
          <p>Dear ${name},</p>
          <p>Welcome to our e-commerce store! We're excited to have you as a customer.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Browse our latest products</li>
            <li>Create wishlists</li>
            <li>Track your orders</li>
            <li>Manage your account</li>
          </ul>
          <p>Happy shopping!</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment failure HTML
   */
  private generatePaymentFailureHTML(orderId: string, reason: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e74c3c;">Payment Failed</h1>
          <p>We're sorry, but your payment for order #${orderId} could not be processed.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please try again or contact our support team if the problem persists.</p>
          <p>Thank you for your understanding.</p>
        </div>
      </body>
      </html>
    `;
  }
}
