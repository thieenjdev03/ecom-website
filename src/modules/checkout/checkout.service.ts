import { BadRequestException, Injectable } from "@nestjs/common";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "../orders/orders.service";
import { Order } from "../orders/entities/order.entity";
import { CreateVietQrOrderDto } from "./dto/create-vietqr-order.dto";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  async createVietQrOrder(
    userId: string,
    cartToken: string | undefined,
    dto: CreateVietQrOrderDto,
    locale = "en",
  ): Promise<{
    order: Order;
    payment: { method: "VIETQR"; status: "PENDING_MANUAL_APPROVAL" };
  }> {
    const shippingAddressId = this.resolveShippingAddressId(dto);
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

    // QR transfers are checked by an administrator. There is no PayPal order
    // creation/capture step, and the order remains PENDING_PAYMENT until review.
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
      notes: dto.notes?.trim() || undefined,
      paymentMethod: "VIETQR",
    });

    await this.cartService.clear(cartToken);

    return {
      order,
      payment: {
        method: "VIETQR",
        status: "PENDING_MANUAL_APPROVAL",
      },
    };
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

  private formatMoney(value: number): string {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException("Cart contains an invalid price.");
    }
    return value.toFixed(2);
  }
}
