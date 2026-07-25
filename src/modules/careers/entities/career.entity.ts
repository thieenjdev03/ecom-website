import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export type CareerStatus = 'draft' | 'published' | 'closed';

@Entity('careers')
export class Career {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 280, unique: true })
  slug: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ length: 50, nullable: true })
  level: string;

  @Column({ type: 'text' })
  content: string; // sanitized HTML

  @Column({ length: 500, nullable: true })
  cover_url: string;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ length: 20, default: 'draft' })
  status: CareerStatus;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date;

  // "Công việc liên quan" — self-referencing many-to-many
  @ManyToMany(() => Career)
  @JoinTable({
    name: 'career_relations',
    joinColumn: { name: 'parent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'child_id', referencedColumnName: 'id' },
  })
  subCareers: Career[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
