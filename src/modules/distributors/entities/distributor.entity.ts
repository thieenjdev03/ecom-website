import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Category } from '../../products/entities/category.entity';
import { Collection } from '../../collections/entities/collection.entity';

@Entity('distributors')
export class Distributor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 280, unique: true })
  slug: string;

  @Column({ length: 255 })
  address_line: string;

  @Column({ length: 120, nullable: true })
  district_text: string;

  @Column({ length: 12 })
  ward_code: string;

  @Column({ length: 120 })
  ward_name: string;

  @Column({ length: 4 })
  province_code: string;

  @Column({ length: 120 })
  province_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  maps_embed_src: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'distributor_categories',
    joinColumn: { name: 'distributor_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @ManyToMany(() => Collection)
  @JoinTable({
    name: 'distributor_collections',
    joinColumn: { name: 'distributor_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'collection_id', referencedColumnName: 'id' },
  })
  collections: Collection[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
