import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type MailOrderItemInput = {
  name?: string;
  productName?: string;
  productSlug?: string;
  variantName?: string;
  quantity?: number;
  price?: number | string;
  unitPrice?: string;
  totalPrice?: string;
  sku?: string;
};

type NormalizedMailOrderItem = {
  title: string;
  variant?: string;
  quantity: number;
  unitPrice?: string;
  totalPrice?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private readonly defaultFromAddress: string;
  private readonly brandName: string;
  private readonly brandUrl: string;
  private readonly privacyUrl: string;
  private readonly termsUrl: string;
  private readonly supportEmail: string;

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

    this.brandName = this.configService.get<string>('MAIL_BRAND_NAME') || 'LUMÉ';

    const configuredBrandUrl =
      this.configService.get<string>('MAIL_BRAND_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://example.com';
    const normalizedBrandUrl = configuredBrandUrl.replace(/\/+$/, '');

    this.brandUrl = normalizedBrandUrl;
    this.privacyUrl =
      this.configService.get<string>('MAIL_PRIVACY_URL') || `${normalizedBrandUrl}/privacy`;
    this.termsUrl =
      this.configService.get<string>('MAIL_TERMS_URL') || `${normalizedBrandUrl}/terms`;
    const fallbackHost = this.getHostnameFromUrl(normalizedBrandUrl);
    this.supportEmail =
      this.configService.get<string>('MAIL_SUPPORT_EMAIL') || `support@${fallbackHost}`;
  }

  /**
   * Generic email sender used across services
   * Accepts either direct HTML or a known template + data
   */
  async sendEmail(payload: {
    to: string;
    subject: string;
    html?: string;
    template?: 'payment-success' | 'order-confirmation' | 'password-reset' | 'welcome' | 'payment-failure' | 'paid-order-confirmation';
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
          case 'paid-order-confirmation': {
            const d = payload.data || {};
            html = this.generatePaidOrderConfirmationHTML({
              customerName: d.customerName,
              orderNumber: d.orderNumber,
              amount: d.amount,
              currency: d.currency,
              items: d.items || [],
              summary: d.summary || {},
              shippingAddress: d.shippingAddress,
              paidAt: d.paidAt,
              transactionId: d.transactionId,
            });
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
    orderTotal: number | string;
    currency: string;
    items: Array<MailOrderItemInput>;
  }): string {
    const normalizedItems = this.normalizeOrderItems(data.items, data.currency);
    const itemsHTML = normalizedItems.length
      ? normalizedItems
          .map(
            (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600;">${item.title}</div>
            ${item.variant ? `<div style="color: #666; font-size: 12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color: #999; font-size: 12px;">Unit: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice ?? item.unitPrice ?? '-'}</td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding: 16px; text-align: center; color: #888;">No order items provided.</td>
        </tr>
      `;

    const totalDisplay = this.formatMoneyFromUnknown(data.orderTotal, data.currency) ?? '-';

    const content = `
      <h1 style="color: #2c3e50; margin: 0 0 16px;">Order Confirmation</h1>
      <p style="margin: 0 0 16px;">Dear ${data.customerName},</p>
      <p style="margin: 0 0 24px;">Thank you for your order! Your order #${data.orderId} has been confirmed.</p>

      <h2 style="margin: 24px 0 12px; font-size: 18px; color: #111;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Item</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Quantity</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin: 0 0 24px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin: 0; font-size: 18px;">Total: ${totalDisplay}</h3>
      </div>

      <p style="margin: 0 0 8px;">We'll send you another email when your order ships.</p>
      <p style="margin: 0;">Thank you for shopping with us!</p>
    `;

    return this.wrapWithLayout(content);
  }

  /**
   * Generate payment success HTML (used by PaymentService)
   */
  private generatePaymentSuccessHTML(data: {
    customerName: string;
    orderNumber: string;
    amount: number | string;
    currency: string;
    items: Array<MailOrderItemInput>;
    summary: any;
  }): string {
    const normalizedItems = this.normalizeOrderItems(data.items, data.currency);
    const itemsHTML = normalizedItems.length
      ? normalizedItems
          .map(
            (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600;">${item.title}</div>
            ${item.variant ? `<div style="color: #666; font-size: 12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color: #999; font-size: 12px;">Unit: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity ?? ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice ?? item.unitPrice ?? '-'}</td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding: 16px; text-align: center; color: #888;">No items available</td>
        </tr>
      `;

    const totalDisplay =
      this.formatMoneyFromUnknown(data.summary?.total ?? data.amount, data.currency) ?? '-';

    const content = `
      <h1 style="color: #2c3e50; margin: 0 0 16px;">Payment Confirmed</h1>
      <p style="margin: 0 0 16px;">Dear ${data.customerName},</p>
      <p style="margin: 0 0 24px;">We have received your payment for order <strong>#${data.orderNumber}</strong>.</p>

      <h2 style="margin: 24px 0 8px; font-size: 18px; color: #111;">Payment Summary</h2>
      <p style="margin: 0 0 24px;"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>

      <h2 style="margin: 24px 0 12px; font-size: 18px; color: #111;">Order Items</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Item</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Quantity</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin: 0 0 24px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin: 0;">Total: ${totalDisplay}</h3>
      </div>

      <p style="margin: 0;">We'll send another update when your order ships. Thank you for your purchase!</p>
    `;

    return this.wrapWithLayout(content);
  }

  /**
   * Generate password reset HTML
   */
  private generatePasswordResetHTML(resetUrl: string): string {
    const content = `
      <h1 style="color: #2c3e50; margin: 0 0 16px;">Password Reset Request</h1>
      <p style="margin: 0 0 16px;">You requested a password reset for your account.</p>
      <p style="margin: 0 0 24px;">Click the button below to reset your password:</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2c3e50; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="margin: 0 0 8px;">This link will expire in 1 hour.</p>
      <p style="margin: 0;">If you didn't request this, please ignore this email.</p>
    `;

    return this.wrapWithLayout(content);
  }

  /**
   * Generate welcome HTML
   */
  private generateWelcomeHTML(name: string): string {
    const safeName = name || 'there';
    const brandUpper = this.brandName.toUpperCase();
    const buttonUrl = this.brandUrl || '#';
    const hostLabel = this.brandUrl ? `go to ${this.getHostnameFromUrl(this.brandUrl)}` : 'visit our store';

    const content = `
      <p style="font-size: 14px; letter-spacing: 4px; color: #a07a62; text-transform: uppercase; margin: 0 0 12px; text-align: center;">
        WELCOME TO ${brandUpper}!
      </p>
      <h1 style="font-size: 26px; margin: 0 0 20px; color: #3d332c; text-align: center;">We're glad you're here</h1>
      <p style="margin: 0 0 12px;">Hi ${safeName}, you've activated your customer account.</p>
      <p style="margin: 0 0 24px;">Log in to view past orders, update your addresses and check-out faster.</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${buttonUrl}" style="display: inline-block; padding: 14px 40px; background-color: #c8a585; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600; text-transform: lowercase;">
          ${hostLabel}
        </a>
      </div>
      <p style="margin: 0; color: #7a6a5a; font-size: 13px; text-align: center;">
        Log back in anytime for a smoother checkout experience.
      </p>
    `;

    return this.wrapWithLayout(content);
  }

  /**
   * Generate payment failure HTML
   */
  private generatePaymentFailureHTML(orderId: string, reason: string): string {
    const content = `
      <h1 style="color: #e74c3c; margin: 0 0 16px;">Payment Failed</h1>
      <p style="margin: 0 0 12px;">We're sorry, but your payment for order #${orderId} could not be processed.</p>
      <p style="margin: 0 0 24px;"><strong>Reason:</strong> ${reason}</p>
      <p style="margin: 0 0 12px;">Please try again or contact our support team if the problem persists.</p>
      <p style="margin: 0;">Thank you for your understanding.</p>
    `;

    return this.wrapWithLayout(content);
  }

  private generatePaidOrderConfirmationHTML(data: {
    customerName?: string;
    orderNumber?: string;
    amount?: number | string;
    currency?: string;
    items?: Array<MailOrderItemInput>;
    summary?: {
      subtotal?: number | string;
      shipping?: number | string;
      tax?: number | string;
      discount?: number | string;
      total?: number | string;
    };
    shippingAddress?: any;
    paidAt?: string | Date;
    transactionId?: string;
  }): string {
    const normalizedItems = this.normalizeOrderItems(data.items, data.currency);
    const itemsHTML = normalizedItems.length
      ? normalizedItems
          .map(
            (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: 600;">${item.title}</div>
            ${item.variant ? `<div style="color: #666; font-size: 12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color: #9a8c82; font-size: 12px;">Unit: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
            ${item.totalPrice ?? item.unitPrice ?? '-'}
          </td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding: 16px 0; text-align: center; color: #8c8c8c;">
            No items available
          </td>
        </tr>
      `;

    const summary = data.summary || {};
    const summaryRows: Array<{ label: string; value: string }> = [];

    const subtotalValue = this.formatMoneyFromUnknown(summary.subtotal, data.currency);
    if (subtotalValue) {
      summaryRows.push({ label: 'Subtotal', value: subtotalValue });
    }

    const shippingValue = this.formatMoneyFromUnknown(summary.shipping, data.currency);
    if (shippingValue) {
      summaryRows.push({ label: 'Shipping', value: shippingValue });
    }

    const taxValue = this.formatMoneyFromUnknown(summary.tax, data.currency);
    if (taxValue) {
      summaryRows.push({ label: 'Tax', value: taxValue });
    }

    const discountValue = this.formatMoneyFromUnknown(summary.discount, data.currency);
    if (discountValue) {
      summaryRows.push({ label: 'Discount', value: `- ${discountValue}` });
    }

    const paidTotal =
      this.formatMoneyFromUnknown(summary.total ?? data.amount, data.currency) ?? '-';

    const summaryHTML =
      summaryRows.length > 0
        ? summaryRows
            .map(
              (row) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; gap: 10px;">
          <div style="color: #5a5148;">${row.label}:</div>
          <div style="font-weight: 600;">${row.value}</div>
        </div>
      `,
            )
            .join('')
        : '';

    const shippingLines = this.renderShippingAddress(data.shippingAddress);

    const paidDate = data.paidAt ? new Date(data.paidAt).toLocaleString('en-US') : null;
    const detailRows = [
      data.transactionId
        ? `<p style="margin: 0 0 4px;">Transaction ID: <strong>${data.transactionId}</strong></p>`
        : '',
      paidDate ? `<p style="margin: 0 0 4px;">Paid on: <strong>${paidDate}</strong></p>` : '',
      `<p style="margin: 0;">Order #: <strong>${data.orderNumber ?? 'N/A'}</strong></p>`,
    ].join('');

    const viewOrderUrl =
      this.brandUrl && data.orderNumber
        ? `${this.brandUrl.replace(/\/$/, '')}/orders/${data.orderNumber}`
        : this.brandUrl || '#';

    const content = `
      <p style="font-size: 14px; letter-spacing: 4px; color: #a07a62; text-transform: uppercase; margin: 0 0 12px;">
        PAYMENT RECEIVED
      </p>
      <h1 style="font-size: 26px; margin: 0 0 12px; color: #3d332c;">Thank you, ${data.customerName ?? 'there'}!</h1>
      <p style="margin: 0 0 24px;">Your payment is confirmed and your order is officially on its way.</p>

      <div style="padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; margin-bottom: 24px; background-color: #faf9f8;">
        ${detailRows}
      </div>

      <h2 style="margin: 0 0 12px; font-size: 18px; color: #3d332c;">Order Summary</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="text-align: left; font-size: 13px; text-transform: uppercase; color: #9a8c82;">
            <th style="padding: 8px 0;">Item</th>
            <th style="padding: 8px 0; text-align: center;">Qty</th>
            <th style="padding: 8px 0; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin-bottom: 24px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
        ${summaryHTML}
        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 16px; margin-top: 8px; gap: 10px;">
          <div>Total Paid:</div>
          <div>${paidTotal}</div>
        </div>
      </div>

      <h2 style="margin: 0 0 12px; font-size: 18px; color: #3d332c;">Shipping to</h2>
      <div style="border: 1px solid #f0f0f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        ${shippingLines}
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${viewOrderUrl}" style="display: inline-block; padding: 14px 36px; background-color: #3d332c; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600;">
          View your order
        </a>
      </div>

      <p style="margin: 0; color: #7a6a5a; font-size: 13px; text-align: center;">
        You'll receive another update when your order ships.
      </p>
    `;

    return this.wrapWithLayout(content);
  }

  private normalizeOrderItems(
    items: MailOrderItemInput[] = [],
    currency?: string,
  ): NormalizedMailOrderItem[] {
    return items.map((item) => {
      const quantity = item.quantity ?? 1;
      const unitPriceValue = this.parseNumericValue(item.unitPrice ?? item.price);
      const totalPriceValue =
        this.parseNumericValue(item.totalPrice) ??
        (unitPriceValue != null ? unitPriceValue * quantity : undefined);

      return {
        title: item.productName || item.name || 'Item',
        variant: item.variantName,
        quantity,
        unitPrice: unitPriceValue != null ? this.formatMoney(unitPriceValue, currency) : undefined,
        totalPrice: totalPriceValue != null ? this.formatMoney(totalPriceValue, currency) : undefined,
      };
    });
  }

  private parseNumericValue(value: string | number | undefined | null): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    const sanitized = value.replace(/,/g, '').trim();
    if (!sanitized) {
      return undefined;
    }

    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private formatMoney(value: number, currency?: string): string {
    const formatted = value.toFixed(2);
    return currency ? `${formatted} ${currency}` : formatted;
  }

  private formatMoneyFromUnknown(
    value: string | number | undefined,
    currency?: string,
  ): string | undefined {
    const numeric = this.parseNumericValue(value);
    if (numeric != null) {
      return this.formatMoney(numeric, currency);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return currency ? `${value} ${currency}` : value;
    }

    return undefined;
  }

  private renderShippingAddress(address: any): string {
    if (!address) {
      return '<p style="margin: 0;">Shipping address not available.</p>';
    }

    const lines: string[] = [];
    const name = address.recipientName ?? address.fullName ?? address.name;
    if (name) {
      lines.push(name);
    }

    const line1 = address.streetLine1 ?? address.line1 ?? address.address_line;
    if (line1) {
      lines.push(line1);
    }

    const line2 = address.streetLine2 ?? address.line2 ?? address.address_line2;
    if (line2) {
      lines.push(line2);
    }

    const locality = [
      address.ward ?? address.city,
      address.district ?? address.state,
      address.province ?? address.region,
    ]
      .filter((part) => part && part.toString().trim().length > 0)
      .join(', ');
    if (locality) {
      lines.push(locality);
    }

    const country =
      address.country ??
      (address.countryCode ? String(address.countryCode).toUpperCase() : undefined);
    const postalLine = [address.postalCode, country]
      .filter((part) => part && part.toString().trim().length > 0)
      .join(', ');
    if (postalLine) {
      lines.push(postalLine);
    }

    const phone = address.recipientPhone ?? address.phone;
    if (phone) {
      lines.push(`Phone: ${phone}`);
    }

    return lines.length
      ? lines.map((line) => `<p style="margin: 0;">${line}</p>`).join('')
      : '<p style="margin: 0;">Shipping address not available.</p>';
  }

  private wrapWithLayout(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${this.brandName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);">
            ${this.renderHeader()}
            <div style="padding: 32px 28px;">
              ${content}
            </div>
            ${this.renderFooter()}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderHeader(): string {
    return `
      <div style="padding: 32px 28px 0; text-align: center;">
        <a href="${this.brandUrl}" style="text-decoration: none; color: #1f1f1f;">
          <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: 600;">
            ${this.brandName.toUpperCase()}
          </span>
        </a>
      </div>
      <div style="margin-top: 24px; height: 1px; background-color: #f0f0f0;"></div>
    `;
  }

  private renderFooter(): string {
    const currentYear = new Date().getFullYear();
    const privacyLink = this.privacyUrl
      ? `<a href="${this.privacyUrl}" style="color: #9a8c82; text-decoration: none; margin: 0 8px;">Privacy policy</a>`
      : '';
    const termsLink = this.termsUrl
      ? `<a href="${this.termsUrl}" style="color: #9a8c82; text-decoration: none; margin: 0 8px;">Terms of service</a>`
      : '';

    return `
      <div style="margin-top: 8px; height: 1px; background-color: #f0f0f0;"></div>
      <div style="text-align: center; padding: 24px 16px 32px;">
        <p style="margin: 0 0 8px; color: #9a8c82; font-size: 13px;">&copy; ${currentYear} ${this.brandName}</p>
        <p style="margin: 0 0 12px; color: #b0a397; font-size: 12px;">Need help? Contact us at <a href="mailto:${this.supportEmail}" style="color: #9a8c82; text-decoration: none;">${this.supportEmail}</a></p>
        <div style="font-size: 12px;">
          ${privacyLink}
          ${termsLink}
        </div>
      </div>
    `;
  }

  private getHostnameFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'https://ecom-client-sable.vercel.app/';
    }
  }
}
