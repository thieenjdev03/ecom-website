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

  @Column({ unique: false, nullable: true })
  phoneNumber: string;

  @Column()
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

  @Column({ nullable: true })
  refreshTokenHash: string;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'John Doe',
  })
  @Column({ default: '' })
  profile: string;

  @OneToMany(() => Address, (a) => a.user, { cascade: false })
  addresses: Address[]; // address foreign to address table

  @OneToMany(() => UserWishlist, (w) => w.userId, { cascade: false })
  wishlists: UserWishlist[]; // address foreign to address table

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