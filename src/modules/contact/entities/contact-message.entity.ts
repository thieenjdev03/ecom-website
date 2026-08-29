import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** Liên hệ gửi từ form /contact của storefront. Lưu trước, gửi mail sau. */
@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  fullName: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 32 })
  phone: string

  @Column({ type: 'varchar', length: 50 })
  department: string

  @Column({ type: 'varchar', length: 255 })
  subject: string

  @Column({ type: 'text' })
  message: string

  /** Mail có thể hỏng (SMTP sập, sai cấu hình) — cờ này để dò lại các liên hệ chưa báo được. */
  @Column({ type: 'boolean', default: false })
  notified: boolean

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string | null

  @CreateDateColumn()
  createdAt: Date
}
