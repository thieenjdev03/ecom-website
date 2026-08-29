import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Bảng key-value cho các cấu hình rời của storefront (link PDF hồ sơ hợp tác,
 * link "contact us" riêng của khách...). Khoá nào chưa có row nghĩa là chưa cấu hình.
 */
@Entity('site_settings')
export class SiteSetting {
  @PrimaryColumn({ length: 64 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn()
  updated_at: Date;
}
