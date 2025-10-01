import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index,
    CreateDateColumn, UpdateDateColumn
  } from 'typeorm';
  import { User } from '../users/user.entity';
  
  @Entity('addresses')
  @Index('idx_addresses_userId', ['userId'])
  @Index('idx_addresses_isDefault', ['userId', 'isDefault'])
  export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
    // FK (foreign key – khoá ngoại) về User
  @Column('uuid')
  userId: string;
  
    @ManyToOne(() => User, (u) => u.addresses, { onDelete: 'CASCADE' })
    user: User;
  
    // Thông tin người nhận
    @Column({ length: 120 })
    recipientName: string;      // tên người nhận
  
    @Column({ length: 20, nullable: true })
    recipientPhone: string;
  
    // Nhãn địa chỉ
    @Column({ length: 40, default: 'Home' })
    label: string; // Home/Work/Other…
  
    // Địa chỉ chi tiết (tách trường rõ ràng để lọc/tính phí)
    @Column({ length: 2 }) countryCode: string; // ISO-3166-1 alpha-2 (VD: VN, US)
    @Column({ length: 120 }) province: string;  // Tỉnh/Thành phố
    @Column({ length: 120 }) district: string;  // Quận/Huyện
    @Column({ length: 120, nullable: true }) ward: string; // Phường/Xã
    @Column({ length: 255 }) streetLine1: string; // Số nhà, tên đường
    @Column({ length: 255, nullable: true }) streetLine2: string; // Toà/Block…
    @Column({ length: 20, nullable: true }) postalCode: string; // Mã bưu chính
  
    // Toạ độ (decimal – số thập phân)
    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude: number;
  
    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude: number;
  
    // Cờ sử dụng
    @Column({ default: true }) isShipping: boolean; // dùng cho giao hàng
    @Column({ default: false }) isBilling: boolean; // dùng cho hoá đơn
    @Column({ default: false }) isDefault: boolean; // mặc định cho user
  
    @Column({ type: 'text', nullable: true })
    note: string; // ghi chú giao hàng
  
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }