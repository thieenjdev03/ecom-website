import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../user.entity';

export enum PhoneLabel {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Entity('user_phone_numbers')
@Unique(['userId', 'phoneNumber'])
@Index(['userId'])
export class UserPhoneNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: PhoneLabel, nullable: true })
  label: PhoneLabel;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

