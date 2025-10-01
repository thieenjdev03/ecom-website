import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm'

@Entity('email_otps')
@Unique('uq_email_otps_email', ['email'])
export class EmailOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('idx_email_otps_email')
  @Column({ length: 320 })
  email!: string

  @Column({ length: 6 })
  otp!: string

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @Column({ default: false })
  isVerified!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}


