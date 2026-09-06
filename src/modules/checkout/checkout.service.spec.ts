import { BadRequestException } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";

describe("CheckoutService", () => {
  const userId = "151d3ba6-17ae-4b79-ad1e-cdd17e738091";
  const addressId = "48741946-5c5c-4c4f-aedf-046a30e36f90";
  let cartService: { getCartForCheckout: jest.Mock; clear: jest.Mock };
  let ordersService: { create: jest.Mock };
  let userRepository: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let mailService: { sendEmail: jest.Mock };
  let service: CheckoutService;

  beforeEach(() => {
    cartService = {
      getCartForCheckout: jest.fn(),
      clear: jest.fn(),
    };
    ordersService = { create: jest.fn() };
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: "guest-user-1", ...data })),
    };
    mailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    service = new CheckoutService(
      cartService as any,
      ordersService as any,
      userRepository as any,
      mailService as any,
    );
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
      orderNumber: "ORD-1",
      status: "PENDING_PAYMENT",
      items: [],
      summary: { subtotal: "120000.00", shipping: "0.00", total: "120000.00", currency: "VND" },
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
    }, undefined);
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

  const shipping = {
    recipient_name: 'Guest', recipient_phone: '0909090909',
    province: 'HCM', district: 'Ward', street_line_1: '123 Street',
  };

  it.each(['COD', 'VIETQR'] as const)('keeps guest %s orders independent and emails a secret tracking link', async (paymentMethod) => {
    userRepository.findOne.mockResolvedValue({ id: 'existing-user', email: 'guest@example.com' });
    cartService.getCartForCheckout.mockResolvedValue({ valid: true, subtotal: 50000, items: [] });
    ordersService.create.mockResolvedValue({ orderNumber: 'ORD-GUEST', items: [], summary: { total: '50000.00' } });
    await service.createVietQrOrder(undefined, 'cart', {
      email: 'guest@example.com', shipping_address: shipping, paymentMethod,
    }, 'vi');
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    const [payload, guest] = ordersService.create.mock.calls[0];
    expect(payload.userId).toBeUndefined();
    expect(guest).toEqual({ email: 'guest@example.com', phone: '84909090909', tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const mail = mailService.sendEmail.mock.calls[0][0];
    expect(mail.to).toBe('guest@example.com');
    expect(mail.html).toContain('/orders/track/ORD-GUEST#token=');
    const token = mail.html.match(/#token=([a-f0-9]{64})/)[1];
    expect(require('crypto').createHash('sha256').update(token).digest('hex')).toBe(guest.tokenHash);
    expect(cartService.clear).toHaveBeenCalledWith('cart');
  });

  it.each([undefined, '', 'invalid'])('rejects missing or invalid guest email: %s', async (email) => {
    await expect(service.createVietQrOrder(undefined, 'cart', { email, shipping_address: shipping })).rejects.toBeInstanceOf(BadRequestException);
    expect(ordersService.create).not.toHaveBeenCalled();
    expect(cartService.clear).not.toHaveBeenCalled();
  });

  it.each(['', '123', 'abc'])('rejects invalid guest phone: %s', async (phone) => {
    await expect(service.createVietQrOrder(undefined, 'cart', { email: 'guest@example.com', shipping_address: { ...shipping, recipient_phone: phone } })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('preserves the created order when mail delivery fails', async () => {
    cartService.getCartForCheckout.mockResolvedValue({ valid: true, subtotal: 50000, items: [] });
    ordersService.create.mockResolvedValue({ orderNumber: 'ORD-GUEST', items: [], summary: {} });
    mailService.sendEmail.mockRejectedValue(new Error('Mail offline'));
    await expect(service.createVietQrOrder(undefined, 'cart', { email: 'guest@example.com', shipping_address: shipping })).resolves.toHaveProperty('order.orderNumber', 'ORD-GUEST');
  });

  it('rejects guest checkout without a shipping address', async () => {
    await expect(service.createVietQrOrder(undefined, 'cart', {})).rejects.toBeInstanceOf(BadRequestException);
    expect(cartService.getCartForCheckout).not.toHaveBeenCalled();
  });
});
