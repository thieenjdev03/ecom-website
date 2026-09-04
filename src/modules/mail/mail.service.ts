import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import {
  MINGO,
  MINGO_FONT,
  mingoButton,
  renderMingoEmail,
  type MingoEmailBrand,
} from '../../common/email/mingo-email';

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

// Nhiều PaaS chặn cổng SMTP ra: không có timeout thì nodemailer treo tới 10 phút và
// proxy trả 502 trước khi mình kịp fallback. Hỏng nhanh còn hơn giữ request.
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 } as const;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private readonly transporter: nodemailer.Transporter | null;
  private readonly defaultFromAddress: string;
  private readonly brandName: string;
  private readonly brandUrl: string;
  private readonly privacyUrl: string;
  private readonly termsUrl: string;
  private readonly supportEmail: string;

  constructor(private configService: ConfigService) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');
    // MAIL_HOST cho hộp thư không phải Google (Zoho, cPanel, mail server riêng);
    // bỏ trống thì mặc định Gmail/Google Workspace như OtpService.
    const mailHost = this.configService.get<string>('MAIL_HOST');
    const mailPort = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    this.transporter = mailUser && mailPass
      ? nodemailer.createTransport(
          mailHost
            ? { host: mailHost, port: mailPort, secure: mailPort === 465, auth: { user: mailUser, pass: mailPass }, ...SMTP_TIMEOUTS }
            : { service: 'gmail', secure: false, auth: { user: mailUser, pass: mailPass }, ...SMTP_TIMEOUTS },
        )
      : null;

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        this.transporter
          ? 'RESEND_API_KEY not configured, sending through SMTP (MAIL_USER)'
          : 'Neither RESEND_API_KEY nor MAIL_USER/MAIL_PASS configured, email functionality disabled',
      );
    }

    // Get from address from env or use Resend test domain for development
    // Resend test domain: onboarding@resend.dev (works without domain verification)
    this.defaultFromAddress =
      this.configService.get<string>('MAIL_FROM') ||
      'Mingo <onboarding@resend.dev>';
    
    if (!this.configService.get<string>('MAIL_FROM')) {
      this.logger.warn('MAIL_FROM not configured, using Resend test domain: onboarding@resend.dev');
      this.logger.warn('For production, please set MAIL_FROM to a verified domain in Resend dashboard');
    }

    this.brandName = this.configService.get<string>('MAIL_BRAND_NAME') || 'Mingo';

    const configuredBrandUrl =
      this.configService.get<string>('MAIL_BRAND_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://mingo-store.vercel.app';
    const normalizedBrandUrl = configuredBrandUrl.replace(/\/+$/, '');

    this.brandUrl = normalizedBrandUrl;
    this.privacyUrl =
      this.configService.get<string>('MAIL_PRIVACY_URL') || `${normalizedBrandUrl}/policies`;
    this.termsUrl =
      this.configService.get<string>('MAIL_TERMS_URL') || `${normalizedBrandUrl}/policies`;
    const fallbackHost = this.getHostnameFromUrl(normalizedBrandUrl);
    this.supportEmail =
      this.configService.get<string>('MAIL_SUPPORT_EMAIL') || `support@${fallbackHost}`;
  }

  /**
   * Gửi thật: Resend trước, hỏng (hoặc chưa cấu hình / domain chưa verify) thì rơi xuống SMTP.
   * Cùng thứ tự dự phòng như OtpService để mail đặt lại mật khẩu và mail liên hệ hành xử như nhau.
   */
  private async deliver(message: {
    from: string;
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<void> {
    let lastError: Error | null = null;

    if (this.resend) {
      try {
        const result = await this.resend.emails.send({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        });
        if ((result as any).error) {
          throw new Error((result as any).error.message || 'Resend send failed');
        }
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Resend failed, falling back to SMTP: ${lastError.message}`);
      }
    }

    if (this.transporter) {
      await this.transporter.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        replyTo: message.replyTo,
      });
      return;
    }

    throw lastError ?? new Error('Email service is not configured (RESEND_API_KEY hoặc MAIL_USER/MAIL_PASS)');
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
    replyTo?: string;
  }): Promise<void> {
    try {
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

      await this.deliver({ from: fromAddress, to: payload.to, subject: payload.subject, html, replyTo: payload.replyTo });

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
          <td style="padding: 14px 8px 14px 0;border-bottom:1px solid ${MINGO.border};vertical-align:top;">
            <div style="font-weight:700;color:${MINGO.brown};">${item.title}</div>
            ${item.variant ? `<div style="color:${MINGO.muted};font-size:12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color:${MINGO.muted};font-size:12px;margin-top:3px;">Đơn giá: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid ${MINGO.border};text-align:center;vertical-align:top;">${item.quantity}</td>
          <td style="padding:14px 0 14px 8px;border-bottom:1px solid ${MINGO.border};text-align:right;vertical-align:top;font-weight:700;">${item.totalPrice ?? item.unitPrice ?? '-'}</td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding:16px;text-align:center;color:${MINGO.muted};">No order items provided.</td>
        </tr>
      `;

    const totalDisplay = this.formatMoneyFromUnknown(data.orderTotal, data.currency) ?? '-';
    const customerName = escapeHtml(data.customerName || 'there');
    const orderId = escapeHtml(data.orderId);

    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Order confirmation</p>
      <h1 style="margin:0 0 14px;font-family:${MINGO_FONT};font-size:28px;line-height:1.25;color:${MINGO.brown};">Your order is confirmed!</h1>
      <p style="margin:0 0 12px;">Dear ${customerName},</p>
      <p style="margin:0 0 24px;">Thank you for your order. We’re preparing order <strong>#${orderId}</strong> for you.</p>

      <h2 style="margin:0 0 12px;font-family:${MINGO_FONT};font-size:18px;color:${MINGO.brown};">Order details</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <thead>
          <tr style="background:${MINGO.blush};color:${MINGO.muted};font-size:12px;text-transform:uppercase;letter-spacing:.06em;">
            <th style="padding:10px 8px 10px 12px;text-align:left;">Item</th>
            <th style="padding:10px 8px;text-align:center;">Qty</th>
            <th style="padding:10px 12px 10px 8px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin:0 0 24px;padding:18px 20px;background:${MINGO.ivory};border:1px solid ${MINGO.border};border-radius:16px;">
        <p style="margin:0 0 4px;color:${MINGO.muted};font-size:13px;">Total</p>
        <h3 style="margin:0;font-family:${MINGO_FONT};font-size:22px;color:${MINGO.orange};">${totalDisplay}</h3>
      </div>

      <p style="margin:0 0 8px;">We’ll send you another email when your order ships.</p>
      <p style="margin:0;color:${MINGO.muted};">Thank you for shopping with us!</p>
    `;

    return this.wrapWithLayout(
      content,
      `Order confirmed - #${data.orderId}`,
      `Your Mingo order #${data.orderId} is confirmed.`,
    );
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
          <td style="padding:14px 8px 14px 0;border-bottom:1px solid ${MINGO.border};vertical-align:top;">
            <div style="font-weight:700;color:${MINGO.brown};">${item.title}</div>
            ${item.variant ? `<div style="color:${MINGO.muted};font-size:12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color:${MINGO.muted};font-size:12px;margin-top:3px;">Đơn giá: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid ${MINGO.border};text-align:center;vertical-align:top;">${item.quantity ?? ''}</td>
          <td style="padding:14px 0 14px 8px;border-bottom:1px solid ${MINGO.border};text-align:right;vertical-align:top;font-weight:700;">${item.totalPrice ?? item.unitPrice ?? '-'}</td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding:16px;text-align:center;color:${MINGO.muted};">No items available</td>
        </tr>
      `;

    const totalDisplay =
      this.formatMoneyFromUnknown(data.summary?.total ?? data.amount, data.currency) ?? '-';
    const customerName = escapeHtml(data.customerName || 'there');
    const orderNumber = escapeHtml(data.orderNumber);
    const currency = escapeHtml(data.currency);

    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Payment received</p>
      <h1 style="margin:0 0 14px;font-family:${MINGO_FONT};font-size:28px;line-height:1.25;color:${MINGO.brown};">Payment confirmed</h1>
      <p style="margin:0 0 16px;">Dear ${customerName},</p>
      <p style="margin:0 0 24px;">We have received your payment for order <strong>#${orderNumber}</strong>.</p>

      <div style="margin:0 0 24px;padding:18px 20px;background:${MINGO.ivory};border:1px solid ${MINGO.border};border-radius:16px;">
        <p style="margin:0 0 4px;color:${MINGO.muted};font-size:13px;">Amount paid</p>
        <p style="margin:0;font-family:${MINGO_FONT};font-size:22px;font-weight:800;color:${MINGO.orange};">${escapeHtml(String(data.amount))} ${currency}</p>
      </div>

      <h2 style="margin:0 0 12px;font-family:${MINGO_FONT};font-size:18px;color:${MINGO.brown};">Order items</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <thead>
          <tr style="background:${MINGO.blush};color:${MINGO.muted};font-size:12px;text-transform:uppercase;letter-spacing:.06em;">
            <th style="padding:10px 8px 10px 12px;text-align:left;">Item</th>
            <th style="padding:10px 8px;text-align:center;">Qty</th>
            <th style="padding:10px 12px 10px 8px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin:0 0 24px;padding:18px 20px;background:${MINGO.ivory};border:1px solid ${MINGO.border};border-radius:16px;">
        <p style="margin:0 0 4px;color:${MINGO.muted};font-size:13px;">Total</p>
        <h3 style="margin:0;font-family:${MINGO_FONT};font-size:22px;color:${MINGO.orange};">${totalDisplay}</h3>
      </div>

      <p style="margin:0;color:${MINGO.muted};">We’ll send another update when your order ships. Thank you for your purchase!</p>
    `;

    return this.wrapWithLayout(
      content,
      `Payment confirmed - #${data.orderNumber}`,
      `Payment received for Mingo order #${data.orderNumber}.`,
    );
  }

  /**
   * Generate password reset HTML
   */
  private generatePasswordResetHTML(resetUrl: string): string {
    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Account security</p>
      <h1 style="margin:0 0 14px;font-family:${MINGO_FONT};font-size:28px;line-height:1.25;color:${MINGO.brown};">Reset your password</h1>
      <p style="margin:0 0 16px;">You requested a password reset for your Mingo account.</p>
      <p style="margin:0 0 24px;">Use the button below to choose a new password:</p>
      <div style="text-align:center;margin:0 0 24px;">
        ${mingoButton(resetUrl, 'Reset password')}
      </div>
      <div style="padding:16px 18px;background:${MINGO.blush};border:1px solid ${MINGO.border};border-radius:16px;">
        <p style="margin:0 0 6px;font-weight:700;color:${MINGO.brown};">This link expires in 1 hour.</p>
        <p style="margin:0;color:${MINGO.muted};font-size:14px;">If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `;

    return this.wrapWithLayout(content, 'Reset your Mingo password', 'Use the secure link to reset your Mingo password.');
  }

  /**
   * Generate welcome HTML
   */
  private generateWelcomeHTML(name: string): string {
    const safeName = escapeHtml(name || 'there');
    const brandUpper = escapeHtml(this.brandName.toUpperCase());

    const content = `
      <p style="font-size:13px;letter-spacing:3px;color:${MINGO.orange};text-transform:uppercase;margin:0 0 8px;text-align:center;font-weight:700;">
        WELCOME TO ${brandUpper}!
      </p>
      <h1 style="font-family:${MINGO_FONT};font-size:28px;line-height:1.25;margin:0 0 18px;color:${MINGO.brown};text-align:center;">We’re glad you’re here</h1>
      <p style="margin:0 0 12px;">Hi ${safeName}, your customer account is ready.</p>
      <p style="margin:0 0 24px;">Log in to view past orders, update your addresses and check out faster.</p>
      <div style="text-align:center;margin:0 0 24px;">
        ${mingoButton(this.brandUrl || '#', 'Explore Mingo')}
      </div>
      <p style="margin:0;color:${MINGO.muted};font-size:13px;text-align:center;">
        Come back anytime for a smoother checkout experience.
      </p>
    `;

    return this.wrapWithLayout(content, `Welcome to ${this.brandName}`, 'Your Mingo customer account is ready.');
  }

  /**
   * Generate payment failure HTML
   */
  private generatePaymentFailureHTML(orderId: string, reason: string): string {
    const safeOrderId = escapeHtml(orderId);
    const safeReason = escapeHtml(reason);
    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.destructive};font-weight:700;">Payment update</p>
      <h1 style="margin:0 0 14px;font-family:${MINGO_FONT};font-size:28px;line-height:1.25;color:${MINGO.brown};">Payment didn’t go through</h1>
      <p style="margin:0 0 16px;">We’re sorry, but the payment for order <strong>#${safeOrderId}</strong> could not be processed.</p>
      <div style="margin:0 0 24px;padding:16px 18px;background:${MINGO.blush};border:1px solid #f1c7c2;border-radius:16px;">
        <p style="margin:0 0 4px;color:${MINGO.muted};font-size:13px;">Reason</p>
        <p style="margin:0;color:${MINGO.brown};font-weight:700;">${safeReason}</p>
      </div>
      <p style="margin:0 0 12px;">Please try again or contact our support team if the problem persists.</p>
      <p style="margin:0;color:${MINGO.muted};">Thank you for your understanding.</p>
    `;

    return this.wrapWithLayout(content, 'Payment update', `Payment failed for Mingo order #${orderId}.`);
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
          <td style="padding:14px 8px 14px 0;border-bottom:1px solid ${MINGO.border};vertical-align:top;">
            <div style="font-weight:700;color:${MINGO.brown};">${item.title}</div>
            ${item.variant ? `<div style="color:${MINGO.muted};font-size:12px;">${item.variant}</div>` : ''}
            ${item.unitPrice ? `<div style="color:${MINGO.muted};font-size:12px;margin-top:3px;">Đơn giá: ${item.unitPrice}</div>` : ''}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid ${MINGO.border};text-align:center;vertical-align:top;">
            ${item.quantity}
          </td>
          <td style="padding:14px 0 14px 8px;border-bottom:1px solid ${MINGO.border};text-align:right;vertical-align:top;font-weight:700;">
            ${item.totalPrice ?? item.unitPrice ?? '-'}
          </td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding:16px 0;text-align:center;color:${MINGO.muted};">
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
        ? `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">${summaryRows
            .map(
              (row) => `
        <tr>
          <td style="padding:4px 0;color:${MINGO.muted};">${row.label}</td>
          <td style="padding:4px 0;text-align:right;font-weight:600;">${row.value}</td>
        </tr>
      `,
            )
            .join('')}</table>`
        : '';

    const shippingLines = this.renderShippingAddress(data.shippingAddress);

    const paidDate = data.paidAt ? new Date(data.paidAt).toLocaleString('en-US') : null;
    const detailRows = [
      data.transactionId
        ? `<p style="margin:0 0 4px;">Transaction ID: <strong>${escapeHtml(data.transactionId)}</strong></p>`
        : '',
      paidDate ? `<p style="margin: 0 0 4px;">Paid on: <strong>${paidDate}</strong></p>` : '',
      `<p style="margin:0;">Order #: <strong>${escapeHtml(data.orderNumber ?? 'N/A')}</strong></p>`,
    ].join('');

    const viewOrderUrl =
      this.brandUrl && data.orderNumber
        ? `${this.brandUrl.replace(/\/$/, '')}/orders/${data.orderNumber}`
        : this.brandUrl || '#';
    const customerName = escapeHtml(data.customerName ?? 'there');

    const content = `
      <p style="font-size:13px;letter-spacing:3px;color:${MINGO.orange};text-transform:uppercase;margin:0 0 8px;font-weight:700;">
        PAYMENT RECEIVED
      </p>
      <h1 style="font-family:${MINGO_FONT};font-size:28px;line-height:1.25;margin:0 0 12px;color:${MINGO.brown};">Thank you, ${customerName}!</h1>
      <p style="margin:0 0 24px;">Your payment is confirmed and your order is officially on its way.</p>

      <div style="padding:18px 20px;border:1px solid ${MINGO.border};border-radius:16px;margin-bottom:24px;background:${MINGO.ivory};">
        ${detailRows}
      </div>

      <h2 style="margin:0 0 12px;font-family:${MINGO_FONT};font-size:18px;color:${MINGO.brown};">Order summary</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
        <thead>
          <tr style="background:${MINGO.blush};color:${MINGO.muted};font-size:12px;text-transform:uppercase;letter-spacing:.06em;">
            <th style="padding:10px 8px 10px 12px;text-align:left;">Item</th>
            <th style="padding:10px 8px;text-align:center;">Qty</th>
            <th style="padding:10px 12px 10px 8px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin-bottom:24px;padding:12px 16px 0;border-top:1px solid ${MINGO.border};">
        ${summaryHTML}
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:8px;font-size:16px;font-weight:700;">
          <tr><td style="padding:8px 0;">Total paid</td><td style="padding:8px 0;text-align:right;color:${MINGO.orange};">${paidTotal}</td></tr>
        </table>
      </div>

      <h2 style="margin:0 0 12px;font-family:${MINGO_FONT};font-size:18px;color:${MINGO.brown};">Shipping to</h2>
      <div style="border:1px solid ${MINGO.border};border-radius:16px;padding:16px;margin-bottom:24px;">
        ${shippingLines}
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${mingoButton(viewOrderUrl, 'View your order')}
      </div>

      <p style="margin:0;color:${MINGO.muted};font-size:13px;text-align:center;">
        You'll receive another update when your order ships.
      </p>
    `;

    return this.wrapWithLayout(
      content,
      `Payment received - #${data.orderNumber ?? 'N/A'}`,
      `Payment received for Mingo order #${data.orderNumber ?? 'N/A'}.`,
    );
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
        title: escapeHtml(item.productName || item.name || 'Item'),
        variant: item.variantName ? escapeHtml(item.variantName) : undefined,
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
      return `<p style="margin:0;color:${MINGO.muted};">Shipping address not available.</p>`;
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
      ? lines.map((line) => `<p style="margin:0;">${escapeHtml(line)}</p>`).join('')
      : `<p style="margin:0;color:${MINGO.muted};">Shipping address not available.</p>`;
  }

  private get mingoBrand(): MingoEmailBrand {
    return {
      brandName: this.brandName,
      brandUrl: this.brandUrl,
      supportEmail: this.supportEmail,
      privacyUrl: this.privacyUrl,
      termsUrl: this.termsUrl,
    };
  }

  /** Bọc nội dung trong layout email Mingo dùng chung (header/footer/brand đồng bộ). */
  private wrapWithLayout(content: string, title = this.brandName, preheader?: string): string {
    return renderMingoEmail(this.mingoBrand, {
      title,
      preheader,
      content,
    });
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
