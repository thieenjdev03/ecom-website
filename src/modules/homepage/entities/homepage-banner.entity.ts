import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('homepage_banners')
export class HomepageBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  image_url: string;

  @Column({ length: 255, nullable: true })
  alt_text: string;

  @Column({ length: 500, nullable: true })
  link_url: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
