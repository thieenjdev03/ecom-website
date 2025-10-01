import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GlobalOption } from './option.entity';

@Entity('option_values')
export class GlobalOptionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  optionId: string;

  @ManyToOne(() => GlobalOption)
  @JoinColumn({ name: 'optionId' })
  option: GlobalOption;

  @Column()
  value: string; // Red, Blue, S, M

  @Column({ type: 'int', default: 0 })
  sort: number;
}


