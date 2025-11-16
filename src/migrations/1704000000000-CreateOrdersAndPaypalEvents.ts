import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersAndPaypalEvents1704000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if orders table exists
    const ordersTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    // Create orders table if it doesn't exist
    if (!ordersTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED')),
          
          -- PayPal integration fields
          "paypalOrderId" VARCHAR(100),
          "paypalTransactionId" VARCHAR(100),
          "paidAmount" DECIMAL(10,2),
          "paidCurrency" VARCHAR(3),
          "paidAt" TIMESTAMP,
          
          -- Order content
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          summary JSONB NOT NULL DEFAULT '{}'::jsonb,
          
          -- Address references
          "shippingAddressId" UUID,
          "billingAddressId" UUID,
          
          -- Additional information
          notes TEXT,
          "internalNotes" TEXT,
          
          -- Shipping tracking
          "trackingNumber" VARCHAR(100),
          carrier VARCHAR(100),
          "shippedAt" TIMESTAMP,
          "deliveredAt" TIMESTAMP,
          
          -- Timestamps
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          
          -- Foreign key constraints
          CONSTRAINT fk_orders_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
          CONSTRAINT fk_orders_shipping_address FOREIGN KEY ("shippingAddressId") REFERENCES addresses(id) ON DELETE SET NULL,
          CONSTRAINT fk_orders_billing_address FOREIGN KEY ("billingAddressId") REFERENCES addresses(id) ON DELETE SET NULL
        );
      `);

      // Create indexes for orders table
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders("userId");
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_paypalOrderId ON orders("paypalOrderId");
        CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders("orderNumber");
        CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt");
      `);
    }

    // Check if paypal_events table exists
    const paypalEventsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'paypal_events'
      );
    `);

    // Create paypal_events table if it doesn't exist
    if (!paypalEventsTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE paypal_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "eventId" VARCHAR(100) UNIQUE NOT NULL,
          "orderId" VARCHAR(100),
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2),
          currency VARCHAR(3),
          status VARCHAR(20),
          "rawData" JSONB,
          "processingNotes" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create indexes for paypal_events table
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_paypal_events_eventId ON paypal_events("eventId");
        CREATE INDEX IF NOT EXISTS idx_paypal_events_orderId ON paypal_events("orderId");
        CREATE INDEX IF NOT EXISTS idx_paypal_events_type ON paypal_events(type);
        CREATE INDEX IF NOT EXISTS idx_paypal_events_createdAt ON paypal_events("createdAt");
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop paypal_events table
    await queryRunner.query(`DROP TABLE IF EXISTS paypal_events;`);
    
    // Drop orders table
    await queryRunner.query(`DROP TABLE IF EXISTS orders;`);
  }
}
