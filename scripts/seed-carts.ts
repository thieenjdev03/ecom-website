import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../src/database/typeorm.config';
import { User } from '../src/modules/users/user.entity';
import { Cart, CartStatus } from '../src/modules/cart/entities/cart.entity';
import { CartItem } from '../src/modules/cart/entities/cart-item.entity';
import { ProductVariant } from '../src/modules/products/entity/product-variant.entity';

async function run() {
  const ds: DataSource = await dataSource.initialize();
  try {
    const userRepo = ds.getRepository(User);
    const cartRepo = ds.getRepository(Cart);
    const cartItemRepo = ds.getRepository(CartItem);
    const variantRepo = ds.getRepository(ProductVariant);

    const users = await userRepo.find();
    if (users.length === 0) {
      console.warn('No users found. Run seed:users first.');
      return;
    }

    const variants = await variantRepo.find({ take: 50, order: { createdAt: 'DESC' } });
    if (variants.length === 0) {
      console.warn('No product variants found. Seed products first.');
      return;
    }

    for (const [idx, user] of users.entries()) {
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
      if (existingItems.length === 0) {
        const itemsToAdd = Math.min(3, variants.length);
        for (let i = 0; i < itemsToAdd; i++) {
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
    }

    // eslint-disable-next-line no-console
    console.log('✅ Seeded carts successfully');
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


