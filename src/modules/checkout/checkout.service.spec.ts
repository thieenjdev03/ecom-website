import { BadRequestException } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";

describe("CheckoutService", () => {
  const userId = "151d3ba6-17ae-4b79-ad1e-cdd17e738091";
  const addressId = "48741946-5c5c-4c4f-aedf-046a30e36f90";
  let cartService: { getCartForCheckout: jest.Mock; clear: jest.Mock };
  let ordersService: { create: jest.Mock };
  let service: CheckoutService;

  beforeEach(() => {
    cartService = {
      getCartForCheckout: jest.fn(),
      clear: jest.fn(),
    };
    ordersService = { create: jest.fn() };
    service = new CheckoutService(cartService as any, ordersService as any);
  });

  it("creates a pending VIETQR order from server-side cart values and clears the cart", async () => {
    cartService.getCartForCheckout.mockResolvedValue({
      valid: true,
      subtotal: 120000,
      items: [
        {
          quantity: 2,
          variantSku: "SKU-RED",
          variantName: "Red",
          unitPrice: 60000,
          lineTotal: 120000,
          product: {
            id: "11a2f4d1-4f4d-4010-8d88-7e197e569e4e",
            name: "Tea",
            slug: "tea",
          },
        },
      ],
    });
    ordersService.create.mockResolvedValue({
      id: "order-1",
      status: "PENDING_PAYMENT",
    });

    const result = await service.createVietQrOrder(
      userId,
      "cart-token",
      { shipping_address_id: addressId, notes: "  Please call  " },
      "vi",
    );

    expect(ordersService.create).toHaveBeenCalledWith({
      userId,
      shippingAddressId: addressId,
      paymentMethod: "VIETQR",
      notes: "Please call",
      items: [
        {
          productId: "11a2f4d1-4f4d-4010-8d88-7e197e569e4e",
          productName: "Tea",
          productSlug: "tea",
          variantName: "Red",
          quantity: 2,
          unitPrice: "60000.00",
          totalPrice: "120000.00",
          sku: "SKU-RED",
        },
      ],
      summary: {
        subtotal: "120000.00",
        shipping: "0.00",
        tax: "0.00",
        discount: "0.00",
        total: "120000.00",
        currency: "VND",
      },
    });
    expect(cartService.clear).toHaveBeenCalledWith("cart-token");
    expect(result.payment).toEqual({
      method: "VIETQR",
      status: "PENDING_MANUAL_APPROVAL",
    });
  });

  it("does not create or clear an invalid cart", async () => {
    cartService.getCartForCheckout.mockResolvedValue({
      valid: false,
      items: [],
      subtotal: 0,
    });

    await expect(
      service.createVietQrOrder(userId, "cart-token", {
        shipping_address_id: addressId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(ordersService.create).not.toHaveBeenCalled();
    expect(cartService.clear).not.toHaveBeenCalled();
  });

  it("rejects disagreeing address aliases before reading the cart", async () => {
    await expect(
      service.createVietQrOrder(userId, "cart-token", {
        shipping_address_id: addressId,
        shippingAddressId: "c73df649-60a6-4f8f-9c7c-8b4ba439c2ee",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(cartService.getCartForCheckout).not.toHaveBeenCalled();
  });
});
