import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Category } from '../../products/entities/category.entity';

@Entity('sizes')
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Display label — e.g. "24 cây / thùng", "Hộp 250ml", "M".
  @Column({ length: 100 })
  name: string;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'size_categories',
    joinColumn: { name: 'size_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  // Đơn vị lẻ: 'cây', 'hộp', 'lít', ... (packaging). Null for clothing sizes.
  @Column({ length: 20, nullable: true })
  unit: string | null;

  // Số lượng / thùng: 24, 12 (packaging). Null when not a case-pack.
  @Column({ name: 'pack_qty', type: 'int', nullable: true })
  packQty: number | null;

  // Dung tích ml: 250, 500 (packaging). Null when not volume-based.
  @Column({ name: 'volume_ml', type: 'int', nullable: true })
  volumeMl: number | null;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


