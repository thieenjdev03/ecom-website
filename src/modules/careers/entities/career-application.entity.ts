import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Career } from './career.entity';

export type CareerApplicationStatus = 'new' | 'reviewing' | 'rejected' | 'hired';

@Entity('career_applications')
export class CareerApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  career_id: string;

  @ManyToOne(() => Career, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  cover_letter: string;

  @Column({ length: 500 })
  cv_url: string;

  @Column({ length: 20, default: 'new' })
  status: CareerApplicationStatus;

  @CreateDateColumn()
  created_at: Date;
}
