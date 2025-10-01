import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../src/database/typeorm.config';
import { User } from '../src/modules/users/user.entity';
import { Cart, CartStatus } from '../src/modules/cart/entities/cart.entity';
import { CartItem } from '../src/modules/cart/entities/cart-item.entity';
import { UserWishlist } from '../src/modules/users/entities/user-wishlist.entity';
import { Product } from '../src/modules/products/product.entity';
import { ProductVariant } from '../src/modules/products/entity/product-variant.entity';

async function run() {
  const ds: DataSource = await dataSource.initialize();
  try {
    const userRepo = ds.getRepository(User);
    const cartRepo = ds.getRepository(Cart);
    const cartItemRepo = ds.getRepository(CartItem);
    const wishlistRepo = ds.getRepository(UserWishlist);
    const productRepo = ds.getRepository(Product);
    const variantRepo = ds.getRepository(ProductVariant);

    const users = await userRepo.find();
    if (users.length === 0) {
      console.warn('No users found. Run seed:users first.');
      return;
    }

    // Fetch some products/variants to use in seed data
    const products = await productRepo.find({ take: 10, order: { createdAt: 'DESC' } });
    const variants = await variantRepo.find({ take: 20, order: { createdAt: 'DESC' } });

    for (const [idx, user] of users.entries()) {
      // Ensure phone number
      if (!user.phoneNumber) {
        user.phoneNumber = `0900000${(100 + idx).toString()}`;
        await userRepo.save(user);
      }

      // Ensure a cart exists with a couple of items
      let cart = await cartRepo.findOne({ where: { userId: user.id } });
      if (!cart) {
        cart = cartRepo.create({
          userId: user.id,
          currency: 'VND',
          status: CartStatus.ACTIVE,
        });
        cart = await cartRepo.save(cart);
      }

      const existingItems = await cartItemRepo.find({ where: { cartId: cart.id } });
      if (existingItems.length === 0 && variants.length > 0) {
        const take = Math.min(2, variants.length);
        for (let i = 0; i < take; i++) {
          const v = variants[(idx + i) % variants.length];
          const item = cartItemRepo.create({
            cartId: cart.id,
            productId: v.productId,
            productVariantId: v.id,
            quantity: 1 + ((idx + i) % 2),
            unitPrice: v.priceFinal ?? v.priceOriginal,
            unitCompareAtPrice: v.priceOriginal,
            discountAmount: '0',
            taxRate: '0.1000',
          });
          await cartItemRepo.save(item);
        }
      }

      // Seed wishlist for the user if empty
      const existingWishlist = await wishlistRepo.find({ where: { userId: user.id } });
      if (existingWishlist.length === 0 && products.length > 0) {
        const take = Math.min(3, products.length);
        for (let i = 0; i < take; i++) {
          const p = products[(idx + i) % products.length];
          const v = variants.find((vv) => vv.productId === p.id) || variants[(idx + i) % variants.length];
          if (!v) continue;
          const wl = wishlistRepo.create({
            userId: user.id,
            productId: p.id,
            productVariantId: v?.id,
            note: 'Seeded wishlist item',
          });
          try {
            await wishlistRepo.save(wl);
          } catch (e) {
            // unique constraints may collide across users; ignore
          }
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log('✅ Seeded carts, phone numbers, and user wishlist products successfully');
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


