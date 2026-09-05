import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "../orders/orders.service";
import { Order } from "../orders/entities/order.entity";
import { ShippingAddressDto } from "../orders/dto/order.dto";
import { User } from "../users/user.entity";
import { Role } from "../../auth/enums/role.enum";
import { normalizeVnPhone } from "../../common/phone.util";
import { MailService } from "../mail/mail.service";
import { renderMingoEmail, mingoBrandFromEnv, MINGO } from "../../common/email/mingo-email";
import { CheckoutShippingAddressDto, CreateVietQrOrderDto } from "./dto/create-vietqr-order.dto";

type CheckoutPaymentMethod = "VIETQR" | "COD";

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async createVietQrOrder(
    authenticatedUserId: string | undefined,
    cartToken: string | undefined,
    dto: CreateVietQrOrderDto,
    locale = "en",
  ): Promise<{
    order: Order;
    payment: { method: CheckoutPaymentMethod; status: "PENDING_MANUAL_APPROVAL" | "PENDING" };
  }> {
    const paymentMethod = this.resolvePaymentMethod(dto);

    let userId: string;
    let shippingAddressId: string | undefined;
    let shippingAddress: ShippingAddressDto | undefined;
    let recipientUser: User | null = null;

    if (authenticatedUserId) {
      userId = authenticatedUserId;
      if (dto.shipping_address) {
        shippingAddress = this.toOrdersShippingAddress(dto.shipping_address);
      } else {
        shippingAddressId = this.resolveShippingAddressId(dto);
      }
    } else {
      if (!dto.shipping_address) {
        throw new BadRequestException(
          "Guest checkout requires shipping_address (with recipient_phone) since there is no saved address to use.",
        );
      }
      const guest = await this.findOrCreateGuestIdentity(dto.shipping_address.recipient_phone, {
        recipientName: dto.shipping_address.recipient_name,
        email: dto.email,
      });
      userId = guest.id;
      recipientUser = guest;
      shippingAddress = this.toOrdersShippingAddress(dto.shipping_address);
    }

    const cart = await this.cartService.getCartForCheckout(cartToken, locale);

    if (!cart.valid) {
      throw new BadRequestException(
        "Cart is empty or contains unavailable items. Refresh the cart before checkout.",
      );
    }

    const subtotal = this.formatMoney(cart.subtotal);
    const items = cart.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      variantName: item.variantName ?? undefined,
      quantity: item.quantity,
      unitPrice: this.formatMoney(item.unitPrice),
      totalPrice: this.formatMoney(item.lineTotal),
      sku: item.variantSku ?? undefined,
    }));

    // VIETQR transfers and COD deliveries are both confirmed manually by staff —
    // no PayPal order creation/capture step, order stays PENDING_PAYMENT until review.
    const order = await this.ordersService.create({
      userId,
      items,
      summary: {
        subtotal,
        shipping: "0.00",
        tax: "0.00",
        discount: "0.00",
        total: subtotal,
        currency: "VND",
      },
      shippingAddressId,
      shipping_address: shippingAddress,
      notes: dto.notes?.trim() || undefined,
      paymentMethod,
    });

    await this.cartService.clear(cartToken);

    if (!recipientUser) {
      recipientUser = await this.userRepository.findOne({ where: { id: userId } });
    }
    await this.sendOrderConfirmationEmail(order, paymentMethod, recipientUser, dto.shipping_address);

    return {
      order,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "COD" ? "PENDING" : "PENDING_MANUAL_APPROVAL",
      },
    };
  }

  /**
   * Best-effort: a failed send must never fail the checkout response — the
   * order is already committed by this point. Guests who only gave a phone
   * number (no email) simply don't get one; that's expected, not an error.
   */
  private async sendOrderConfirmationEmail(
    order: Order,
    paymentMethod: CheckoutPaymentMethod,
    recipientUser: User | null,
    shippingAddress: CheckoutShippingAddressDto | undefined,
  ): Promise<void> {
    const email = recipientUser?.email;
    if (!email) {
      this.logger.warn(`Order ${order.orderNumber} has no recipient email — skipping confirmation mail.`);
      return;
    }

    const recipientName =
      shippingAddress?.recipient_name ||
      [recipientUser?.firstName, recipientUser?.lastName].filter(Boolean).join(" ") ||
      email;

    try {
      await this.mailService.sendEmail({
        to: email,
        subject: `Mingo đã nhận đơn hàng ${order.orderNumber}`,
        html: this.buildOrderConfirmationEmail(order, paymentMethod, recipientName),
      });
    } catch (error) {
      this.logger.error(`Không gửi được mail xác nhận đơn hàng ${order.orderNumber}`, error as Error);
    }
  }

  private buildOrderConfirmationEmail(
    order: Order,
    paymentMethod: CheckoutPaymentMethod,
    recipientName: string,
  ): string {
    const items: Array<{ productName: string; variantName?: string; quantity: number; totalPrice: string }> =
      order.items ?? [];
    const summary: { subtotal?: string; shipping?: string; total?: string; currency?: string } =
      order.summary ?? {};

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;color:${MINGO.muted};font-size:13px;">${label}</td>
        <td style="padding:8px 0;color:${MINGO.brown};font-size:14px;font-weight:600;text-align:right;">${value}</td>
      </tr>`;

    const itemsHtml = items.length
      ? items
          .map(
            (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${MINGO.border};">
            <div style="font-weight:600;color:${MINGO.brown};">${escapeHtml(item.productName)}</div>
            ${item.variantName ? `<div style="color:${MINGO.muted};font-size:12px;">${escapeHtml(item.variantName)}</div>` : ""}
            <div style="color:${MINGO.muted};font-size:12px;">SL: ${item.quantity}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${MINGO.border};text-align:right;color:${MINGO.brown};font-weight:600;">${escapeHtml(item.totalPrice ?? "")} ${escapeHtml(summary.currency ?? "")}</td>
        </tr>`,
          )
          .join("")
      : "";

    const isCod = paymentMethod === "COD";
    const title = isCod ? "Đặt hàng thành công!" : "Mingo đã nhận được đơn hàng của bạn";
    const statusNote = isCod
      ? `Đơn hàng <strong>${escapeHtml(order.orderNumber)}</strong> đã được ghi nhận. Nhân viên Mingo Ice Cream Vietnam sẽ sớm liên lạc để xác nhận đơn hàng và bạn vui lòng chú ý điện thoại trong vài phút sắp tới.`
      : `Đơn hàng <strong>${escapeHtml(order.orderNumber)}</strong> đang chờ chuyển khoản. Sau khi bạn chuyển khoản đúng nội dung, đội ngũ Mingo sẽ kiểm tra và xác nhận đơn trong thời gian sớm nhất.`;

    const content = `
      <p style="margin:0 0 18px;font-size:16px;color:${MINGO.brown};">Chào <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${MINGO.brown};">${statusNote}</p>

      <p style="margin:0 0 10px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Chi tiết đơn hàng</p>
      <div style="background:${MINGO.ivory};border:1px solid ${MINGO.border};border-radius:12px;padding:18px 20px;">
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;padding-top:12px;border-top:1px solid ${MINGO.border};">
          ${row("Tạm tính", `${escapeHtml(summary.subtotal ?? "")} ${escapeHtml(summary.currency ?? "")}`)}
          ${row("Phí vận chuyển", `${escapeHtml(summary.shipping ?? "0.00")} ${escapeHtml(summary.currency ?? "")}`)}
          ${row("Tổng cộng", `${escapeHtml(summary.total ?? "")} ${escapeHtml(summary.currency ?? "")}`)}
          ${row("Phương thức thanh toán", isCod ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản VietQR")}
        </table>
      </div>
    `;

    return renderMingoEmail(mingoBrandFromEnv(), {
      title,
      preheader: `Đơn ${order.orderNumber} đã được ghi nhận.`,
      content,
    });
  }

  private resolvePaymentMethod(dto: CreateVietQrOrderDto): CheckoutPaymentMethod {
    const legacy = dto.payment_method;
    const camelCase = dto.paymentMethod;

    if (legacy && camelCase && legacy !== camelCase) {
      throw new BadRequestException(
        "payment_method and paymentMethod must refer to the same value.",
      );
    }

    return (camelCase ?? legacy ?? "VIETQR") as CheckoutPaymentMethod;
  }

  private resolveShippingAddressId(dto: CreateVietQrOrderDto): string {
    const legacy = dto.shipping_address_id;
    const camelCase = dto.shippingAddressId;

    if (legacy && camelCase && legacy !== camelCase) {
      throw new BadRequestException(
        "shipping_address_id and shippingAddressId must refer to the same address.",
      );
    }

    const addressId = camelCase ?? legacy;
    if (!addressId) {
      throw new BadRequestException("A saved shipping address is required.");
    }
    return addressId;
  }

  private toOrdersShippingAddress(address: CheckoutShippingAddressDto): ShippingAddressDto {
    const mapped = new ShippingAddressDto();
    mapped.full_name = address.recipient_name;
    mapped.phone = address.recipient_phone;
    mapped.countryCode = "VN";
    mapped.province = address.province;
    mapped.district = address.district;
    mapped.ward = address.ward;
    mapped.address_line = address.street_line_1;
    return mapped;
  }

  /**
   * Find the account owning this phone (primary) or, failing that, this
   * email — or create a passwordless "guest" account for the phone. Checking
   * both means a guest who reuses an email tied to an existing account (even
   * one they registered under a different phone) still gets their order
   * linked to that account instead of a fresh disconnected guest.
   */
  private async findOrCreateGuestIdentity(
    rawPhone: string,
    opts: { recipientName?: string; email?: string },
  ): Promise<User> {
    const phone = normalizeVnPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException("A valid recipient_phone is required for guest checkout.");
    }
    const email = opts.email?.trim().toLowerCase() || undefined;

    let existing = await this.userRepository.findOne({ where: { phoneNumber: phone } });
    if (!existing && email) {
      existing = await this.userRepository.findOne({ where: { email } });
    }

    if (existing) {
      let dirty = false;
      // Backfill only — never overwrite a value the account already has, so a
      // guest checkout can't silently change contact info on someone else's
      // real account.
      if (email && !existing.email) {
        existing.email = email;
        dirty = true;
      }
      if (!existing.phoneNumber) {
        existing.phoneNumber = phone;
        dirty = true;
      }
      if (dirty) {
        await this.userRepository.save(existing);
      }
      return existing;
    }

    const [firstName, ...rest] = (opts.recipientName ?? "").trim().split(/\s+/).filter(Boolean);
    try {
      return await this.userRepository.save(
        this.userRepository.create({
          phoneNumber: phone,
          email: email || null,
          passwordHash: null,
          isGuest: true,
          role: Role.USER,
          firstName: firstName || undefined,
          lastName: rest.join(" ") || undefined,
        }),
      );
    } catch (error: any) {
      // Unique violation: a concurrent guest checkout for the same phone/email won the race.
      if (error?.code === "23505") {
        const winner =
          (await this.userRepository.findOne({ where: { phoneNumber: phone } })) ??
          (email ? await this.userRepository.findOne({ where: { email } }) : null);
        if (winner) return winner;
      }
      throw error;
    }
  }

  private formatMoney(value: number): string {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException("Cart contains an invalid price.");
    }
    return value.toFixed(2);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
