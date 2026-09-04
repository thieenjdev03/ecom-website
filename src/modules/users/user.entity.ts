import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
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

  @ApiPropertyOptional({
    description: 'User email address. Null for a guest account created from checkout until claimed.',
    example: 'user@example.com',
  })
  @Column({ unique: true, nullable: true })
  email: string | null;

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

  // Sensitive: never load or serialize by default. Auth flows must opt in
  // explicitly via QueryBuilder.addSelect('user.passwordHash'). Null for a
  // guest account (created from checkout) until claimed via /auth/set-password.
  @Exclude()
  @Column({ select: false, nullable: true })
  passwordHash: string | null;

  @ApiProperty({
    description: 'True for a guest account auto-created from checkout that has not set a password yet.',
    example: false,
  })
  @Column({ default: false })
  isGuest: boolean;

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

  // Sensitive: never load or serialize by default. Refresh flow opts in
  // explicitly via QueryBuilder.addSelect('user.refreshTokenHash').
  @Exclude()
  @Column({ nullable: true, select: false })
  refreshTokenHash: string;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'John Doe',
  })
  @Column({ default: '' })
  profile: string;

  @ApiProperty({
    description: 'Điểm loyalty tích lũy hiện tại (cache của ledger point_transaction)',
    example: 7,
  })
  @Column({ type: 'int', default: 0 })
  pointsBalance: number;

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