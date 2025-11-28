import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/users/user.entity';
import { Address } from '../modules/addresses/address.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { PaypalEvent } from '../modules/paypal/entities/paypal-event.entity';
import { UserWishlist } from '../modules/users/entities/user-wishlist.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Category } from '../modules/products/entities/category.entity';
import { Color } from '../modules/colors/entities/color.entity';
import { Size } from '../modules/sizes/entities/size.entity';
import { Role } from '../auth/enums/role.enum';
import { OrderStatus } from '../modules/orders/enums/order-status.enum';

export async function completeSeeder(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const addressRepo = dataSource.getRepository(Address);
  const orderRepo = dataSource.getRepository(Order);
  const paypalEventRepo = dataSource.getRepository(PaypalEvent);
  const wishlistRepo = dataSource.getRepository(UserWishlist);
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);
  const colorRepo = dataSource.getRepository(Color);
  const sizeRepo = dataSource.getRepository(Size);

  console.log('🌱 Starting complete database seeding...');

  // 1. Seed Colors (if not exists)
  console.log('📦 Seeding colors...');
  const existingColors = await colorRepo.find();
  if (existingColors.length === 0) {
    const colors = await colorRepo.save([
      colorRepo.create({ name: 'Black', hexCode: '#000000' }),
      colorRepo.create({ name: 'White', hexCode: '#FFFFFF' }),
      colorRepo.create({ name: 'Red', hexCode: '#FF0000' }),
      colorRepo.create({ name: 'Blue', hexCode: '#0000FF' }),
      colorRepo.create({ name: 'Green', hexCode: '#00FF00' }),
      colorRepo.create({ name: 'Pink', hexCode: '#FFC0CB' }),
      colorRepo.create({ name: 'Navy', hexCode: '#000080' }),
      colorRepo.create({ name: 'Gray', hexCode: '#808080' }),
    ]);
    console.log(`✅ Created ${colors.length} colors`);
  } else {
    console.log(`ℹ️  Colors already exist (${existingColors.length} colors)`);
  }

  // 2. Seed Categories (if not exists)
  console.log('📦 Seeding categories...');
  let categories = await categoryRepo.find();
  if (categories.length === 0) {
    const apparel = await categoryRepo.save(
      categoryRepo.create({
        name: 'Apparel',
        slug: 'apparel',
        description: 'All types of clothing',
        display_order: 1,
        is_active: true,
      }),
    );
    const tshirts = await categoryRepo.save(
      categoryRepo.create({
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'Comfortable t-shirts',
        parent: apparel,
        display_order: 1,
        is_active: true,
      }),
    );
    categories = [apparel, tshirts];
    console.log(`✅ Created ${categories.length} categories`);
  } else {
    console.log(`ℹ️  Categories already exist (${categories.length} categories)`);
  }

  // 3. Seed Sizes (if not exists)
  console.log('📦 Seeding sizes...');
  const existingSizes = await sizeRepo.find();
  if (existingSizes.length === 0) {
    const tshirtCategory = categories.find((c) => c.slug === 't-shirts') || categories[0];
    const sizes = await sizeRepo.save([
      sizeRepo.create({ name: 'S', category: tshirtCategory, sortOrder: 1 }),
      sizeRepo.create({ name: 'M', category: tshirtCategory, sortOrder: 2 }),
      sizeRepo.create({ name: 'L', category: tshirtCategory, sortOrder: 3 }),
      sizeRepo.create({ name: 'XL', category: tshirtCategory, sortOrder: 4 }),
      sizeRepo.create({ name: 'XXL', category: tshirtCategory, sortOrder: 5 }),
    ]);
    console.log(`✅ Created ${sizes.length} sizes`);
  } else {
    console.log(`ℹ️  Sizes already exist (${existingSizes.length} sizes)`);
  }

  // 4. Seed Products (if not exists)
  console.log('📦 Seeding products...');
  let products = await productRepo.find({ take: 5 });
  if (products.length === 0) {
    const tshirtCategory = categories.find((c) => c.slug === 't-shirts') || categories[0];
    products = await productRepo.save([
      productRepo.create({
        name: {
          en: 'Classic White T-Shirt',
          vi: 'Áo Thun Trắng Cổ Điển',
        },
        slug: {
          en: 'classic-white-tshirt',
          vi: 'ao-thun-trang-co-dien',
        },
        description: {
          en: '100% cotton, comfortable fit for everyday wear',
          vi: '100% cotton, vừa vặn thoải mái cho mặc hàng ngày',
        },
        short_description: {
          en: 'Classic white tee',
          vi: 'Áo thun trắng cổ điển',
        },
        price: 299000,
        sale_price: 249000,
        images: ['https://via.placeholder.com/500x500?text=White+Tee'],
        stock_quantity: 50,
        sku: 'TEE-WHITE-001',
        category_id: tshirtCategory.id,
        tags: ['t-shirt', 'basic', 'unisex'],
        status: 'active',
        is_featured: true,
        enable_sale_tag: true,
        meta_title: {
          en: 'Classic White T-Shirt',
          vi: 'Áo Thun Trắng Cổ Điển',
        },
        meta_description: {
          en: '100% cotton classic white t-shirt for everyday wear',
          vi: 'Áo thun trắng cổ điển 100% cotton cho mặc hàng ngày',
        },
      }),
      productRepo.create({
        name: {
          en: 'Premium Black T-Shirt',
          vi: 'Áo Thun Đen Cao Cấp',
        },
        slug: {
          en: 'premium-black-tshirt',
          vi: 'ao-thun-den-cao-cap',
        },
        description: {
          en: 'Premium quality black t-shirt with soft fabric',
          vi: 'Áo thun đen chất lượng cao với vải mềm mại',
        },
        short_description: {
          en: 'Premium black tee',
          vi: 'Áo thun đen cao cấp',
        },
        price: 349000,
        images: ['https://via.placeholder.com/500x500?text=Black+Tee'],
        stock_quantity: 45,
        sku: 'TEE-BLACK-001',
        category_id: tshirtCategory.id,
        tags: ['t-shirt', 'premium', 'unisex'],
        status: 'active',
        is_featured: false,
        enable_sale_tag: false,
        meta_title: {
          en: 'Premium Black T-Shirt',
          vi: 'Áo Thun Đen Cao Cấp',
        },
        meta_description: {
          en: 'Premium quality black t-shirt with soft fabric',
          vi: 'Áo thun đen chất lượng cao với vải mềm mại',
        },
      }),
    ]);
    console.log(`✅ Created ${products.length} products`);
  } else {
    console.log(`ℹ️  Products already exist (${products.length} products found)`);
  }

  // 5. Seed Users
  console.log('👥 Seeding users...');
  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // Check if users already exist
  const existingUsers = await userRepo.find();
  let users: User[] = [];

  if (existingUsers.length === 0) {
    users = await userRepo.save([
      userRepo.create({
        email: 'admin@example.com',
        passwordHash,
        role: Role.ADMIN,
        firstName: 'Admin',
        lastName: 'User',
        country: 'VN',
        phoneNumber: '+84901234567',
        profile: 'Administrator account',
      }),
      userRepo.create({
        email: 'john.doe@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'John',
        lastName: 'Doe',
        country: 'VN',
        phoneNumber: '+84901234568',
        profile: 'Regular customer',
      }),
      userRepo.create({
        email: 'jane.smith@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Jane',
        lastName: 'Smith',
        country: 'VN',
        phoneNumber: '+84901234569',
        profile: 'Regular customer',
      }),
      userRepo.create({
        email: 'customer@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Customer',
        lastName: 'Test',
        country: 'VN',
        phoneNumber: '+84901234570',
        profile: 'Test customer account',
      }),
    ]);
    console.log(`✅ Created ${users.length} users (password: ${defaultPassword})`);
  } else {
    users = existingUsers;
    console.log(`ℹ️  Users already exist (${users.length} users)`);
  }

  // 6. Seed Addresses
  console.log('📍 Seeding addresses...');
  const existingAddresses = await addressRepo.find();
  let addresses: Address[] = [];

  if (existingAddresses.length === 0) {
    for (const user of users) {
      const userAddresses = await addressRepo.save([
        addressRepo.create({
          userId: user.id,
          recipientName: `${user.firstName} ${user.lastName}`,
          recipientPhone: user.phoneNumber || '+84901234567',
          label: 'Home',
          countryCode: 'VN',
          province: 'Ho Chi Minh City',
          district: 'District 1',
          ward: 'Ben Nghe Ward',
          streetLine1: '123 Nguyen Hue Street',
          streetLine2: 'Apartment 4B',
          postalCode: '700000',
          latitude: 10.7769,
          longitude: 106.7009,
          isShipping: true,
          isBilling: true,
          isDefault: true,
          note: 'Please ring the doorbell',
        }),
        addressRepo.create({
          userId: user.id,
          recipientName: `${user.firstName} ${user.lastName}`,
          recipientPhone: user.phoneNumber || '+84901234567',
          label: 'Work',
          countryCode: 'VN',
          province: 'Ho Chi Minh City',
          district: 'District 3',
          ward: 'Ward 10',
          streetLine1: '456 Le Van Sy Street',
          postalCode: '700000',
          latitude: 10.7831,
          longitude: 106.6881,
          isShipping: true,
          isBilling: false,
          isDefault: false,
        }),
      ]);
      addresses.push(...userAddresses);
    }
    console.log(`✅ Created ${addresses.length} addresses`);
  } else {
    addresses = existingAddresses;
    console.log(`ℹ️  Addresses already exist (${addresses.length} addresses)`);
  }

  // 7. Seed Orders
  console.log('🛒 Seeding orders...');
  const existingOrders = await orderRepo.find();
  let orders: Order[] = [];

  if (existingOrders.length === 0) {
    const regularUsers = users.filter((u) => u.role === Role.USER);
    const userAddressesMap = new Map<string, Address[]>();
    for (const addr of addresses) {
      if (!userAddressesMap.has(addr.userId)) {
        userAddressesMap.set(addr.userId, []);
      }
      userAddressesMap.get(addr.userId)!.push(addr);
    }

    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      const userAddresses = userAddressesMap.get(user.id) || [];
      const shippingAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      const billingAddress = userAddresses.find((a) => a.isBilling) || userAddresses[0];

      if (!shippingAddress || !billingAddress) continue;

      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - (i + 1) * 2); // Different dates for each order

      const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;

      const product = products[i % products.length];
      const quantity = (i % 3) + 1;
      const unitPrice = product.sale_price || product.price;
      const totalPrice = Number(unitPrice) * quantity;

      // Use product.id (UUID string) as OrderItem interface expects UUID string
      const productId = product.id;

      // Extract name and slug from multi-language object (fallback to English)
      const productName = typeof product.name === 'object' ? (product.name.en || product.name.vi || '') : product.name;
      const productSlug = typeof product.slug === 'object' ? (product.slug.en || product.slug.vi || '') : product.slug;

      const orderData = orderRepo.create({
        userId: user.id,
        orderNumber,
        status: i === 0 ? OrderStatus.PAID : i === 1 ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT,
        paymentMethod: i === 0 ? 'PAYPAL' : i === 1 ? 'PAYPAL' : 'COD',
        paypalOrderId: i < 2 ? `PAYPAL-${Date.now()}-${i}` : null,
        paypalTransactionId: i < 2 ? `TXN-${Date.now()}-${i}` : null,
        paidAmount: i < 2 ? String(totalPrice) : null,
        paidCurrency: i < 2 ? 'USD' : null,
        paidAt: i < 2 ? orderDate : null,
        items: [
          {
            productId,
            productName,
            productSlug,
            quantity,
            unitPrice: String(unitPrice),
            totalPrice: String(totalPrice),
            sku: product.sku || undefined,
          },
        ],
        summary: {
          subtotal: String(totalPrice),
          shipping: '50000',
          tax: String(Math.round(totalPrice * 0.1)),
          discount: '0.00',
          total: String(totalPrice + 50000 + Math.round(totalPrice * 0.1)),
          currency: 'VND',
        },
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        notes: i === 0 ? 'Please deliver in the morning' : null,
        createdAt: orderDate,
      });

      const order = await orderRepo.save(orderData);
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders`);
  } else {
    orders = existingOrders;
    console.log(`ℹ️  Orders already exist (${orders.length} orders)`);
  }

  // 8. Seed PayPal Events
  console.log('💳 Seeding PayPal events...');
  const existingPaypalEvents = await paypalEventRepo.find();
  if (existingPaypalEvents.length === 0) {
    const paidOrders = orders.filter((o) => o.status === OrderStatus.PAID && o.paypalOrderId);
    const paypalEvents = [];
    for (const order of paidOrders) {
      paypalEvents.push(
        paypalEventRepo.create({
          eventId: `EVT-${Date.now()}-${order.id.substring(0, 8)}`,
          orderId: order.paypalOrderId!,
          type: 'PAYMENT.CAPTURE.COMPLETED',
          amount: Number(order.paidAmount),
          currency: order.paidCurrency || 'USD',
          status: 'COMPLETED',
          rawData: {
            id: order.paypalOrderId,
            event_type: 'PAYMENT.CAPTURE.COMPLETED',
            resource: {
              id: order.paypalTransactionId,
              amount: {
                value: order.paidAmount,
                currency_code: order.paidCurrency,
              },
            },
          },
          processingNotes: 'Order payment completed successfully',
        }),
      );
    }
    if (paypalEvents.length > 0) {
      await paypalEventRepo.save(paypalEvents);
      console.log(`✅ Created ${paypalEvents.length} PayPal events`);
    } else {
      console.log(`ℹ️  No paid orders found to create PayPal events`);
    }
  } else {
    console.log(`ℹ️  PayPal events already exist (${existingPaypalEvents.length} events)`);
  }

  // 9. Seed User Wishlists
  console.log('❤️  Seeding user wishlists...');
  const existingWishlists = await wishlistRepo.find();
  if (existingWishlists.length === 0) {
    const regularUsers = users.filter((u) => u.role === Role.USER);
    const wishlists = [];
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      wishlists.push(
        wishlistRepo.create({
          userId: user.id,
          note: `Wishlist for ${user.firstName} ${user.lastName}`,
        }),
      );
    }
    if (wishlists.length > 0) {
      await wishlistRepo.save(wishlists);
      console.log(`✅ Created ${wishlists.length} user wishlists`);
    }
  } else {
    console.log(`ℹ️  User wishlists already exist (${existingWishlists.length} wishlists)`);
  }

  console.log('🎉 Complete database seeding finished!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Addresses: ${addresses.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log('\n💡 Default password for all users: password123');
}
