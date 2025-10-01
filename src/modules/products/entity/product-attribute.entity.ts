import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column()
  key: string;

  @Column()
  value: string;
}


