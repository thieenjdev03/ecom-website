import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type MarketingSource = 'register' | 'modal' | 'checkout' | 'import';

@Entity('marketing_contacts')
@Unique('uniq_marketing_contact_email', ['email'])
export class MarketingContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50, default: 'modal' })
  source: MarketingSource;

  @Column({ type: 'boolean', default: true })
  subscribed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

