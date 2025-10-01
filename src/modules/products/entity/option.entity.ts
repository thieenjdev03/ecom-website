import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('options')
export class GlobalOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string; // e.g. COLOR, SIZE
}


