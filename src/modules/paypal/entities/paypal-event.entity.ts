import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('paypal_events')
@Index('idx_paypal_events_eventId', ['eventId'], { unique: true })
@Index('idx_paypal_events_orderId', ['orderId'])
@Index('idx_paypal_events_type', ['type'])
export class PaypalEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  eventId: string; // PayPal event ID

  @Column({ length: 100, nullable: true })
  orderId: string; // Related order ID

  @Column({ length: 50 })
  type: string; // Event type (e.g., PAYMENT.CAPTURE.COMPLETED)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ length: 3, nullable: true })
  currency: string;

  @Column({ length: 20, nullable: true })
  status: string; // Event status

  @Column({ type: 'jsonb', nullable: true })
  rawData: any; // Store the complete webhook payload

  @Column({ type: 'text', nullable: true })
  processingNotes: string; // Any processing notes or errors

  @CreateDateColumn()
  createdAt: Date;
}
