import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../auth/enums/role.enum';
import { Address } from '../addresses/address.entity';
import { UserWishlist } from './entities/user-wishlist.entity';
@Entity()
export class User {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @Column({ unique: false, nullable: true })
  firstName: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @Column({ unique: false, nullable: true })
  lastName: string;

  @ApiPropertyOptional({ description: 'User country', example: 'Vietnam' })
  @Column({ unique: false, nullable: true })
  country: string;

  @ApiPropertyOptional({ description: 'User phone number', example: '0909090909' })
  @Column({ unique: false, nullable: true })
  phoneNumber: string;

  /**
   * `select: false` — KHÔNG BỎ. Thiếu nó thì mọi query load relation `user`
   * (orders, carts…) đều trả bcrypt hash ra response. Nơi cần đọc phải xin
   * tường minh: `.addSelect('u.passwordHash')` hoặc `select: { passwordHash: true }`.
   */
  @Column({ select: false })
  passwordHash: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  /** `select: false` — xem ghi chú ở `passwordHash`. */
  @Column({ nullable: true, select: false })
  refreshTokenHash: string;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'John Doe',
  })
  @Column({ default: '' })
  profile: string;

  @OneToMany(() => Address, (a) => a.user, { cascade: false })
  addresses: Address[];

  @OneToMany(() => UserWishlist, (w) => w.user, { cascade: false })
  wishlists: UserWishlist[];

  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}