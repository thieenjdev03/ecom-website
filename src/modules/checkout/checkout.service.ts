import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "../orders/orders.service";
import { Order } from "../orders/entities/order.entity";
import { ShippingAddressDto } from "../orders/dto/order.dto";
import { User } from "../users/user.entity";
import { Role } from "../../auth/enums/role.enum";
import { normalizeVnPhone } from "../../common/phone.util";
import { CheckoutShippingAddressDto, CreateVietQrOrderDto } from "./dto/create-vietqr-order.dto";

type CheckoutPaymentMethod = "VIETQR" | "COD";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      const guest = await this.findOrCreateGuestByPhone(dto.shipping_address.recipient_phone, {
        recipientName: dto.shipping_address.recipient_name,
        email: dto.email,
      });
      userId = guest.id;
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

    return {
      order,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "COD" ? "PENDING" : "PENDING_MANUAL_APPROVAL",
      },
    };
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
   * Find the account owning this phone number, or create a passwordless
   * "guest" account for it. Reused across guest checkouts so repeat orders
   * from the same phone (guest or a real registered customer) land on the
   * same account instead of spawning a new one each time.
   */
  private async findOrCreateGuestByPhone(
    rawPhone: string,
    opts: { recipientName?: string; email?: string },
  ): Promise<User> {
    const phone = normalizeVnPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException("A valid recipient_phone is required for guest checkout.");
    }

    const existing = await this.userRepository.findOne({ where: { phoneNumber: phone } });
    if (existing) {
      if (opts.email && !existing.email) {
        existing.email = opts.email;
        await this.userRepository.save(existing);
      }
      return existing;
    }

    const [firstName, ...rest] = (opts.recipientName ?? "").trim().split(/\s+/).filter(Boolean);
    try {
      return await this.userRepository.save(
        this.userRepository.create({
          phoneNumber: phone,
          email: opts.email || null,
          passwordHash: null,
          isGuest: true,
          role: Role.USER,
          firstName: firstName || undefined,
          lastName: rest.join(" ") || undefined,
        }),
      );
    } catch (error: any) {
      // Unique violation: a concurrent guest checkout for the same phone won the race.
      if (error?.code === "23505") {
        const winner = await this.userRepository.findOne({ where: { phoneNumber: phone } });
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
