import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContactMessage } from './entities/contact-message.entity'
import { CreateContactDto } from './dto/create-contact.dto'
import { MailService } from '../mail/mail.service'
import { renderMingoEmail, mingoBrandFromEnv, MINGO, MINGO_FONT } from '../../common/email/mingo-email'

const DEPARTMENT_LABEL: Record<string, string> = {
  customerCare: 'Chăm sóc khách hàng',
  business: 'Hợp tác kinh doanh',
  orderComplaint: 'Khiếu nại đơn hàng',
  other: 'Khác',
}

/** Tối đa 5 liên hệ / IP / giờ. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)
  // ponytail: rate limit in-memory, chỉ đúng trong 1 instance — chuyển sang Redis nếu scale nhiều pod.
  private readonly hits = new Map<string, number[]>()

  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepo: Repository<ContactMessage>,
    private readonly mailService: MailService,
  ) {}

  private assertNotFlooding(ip: string | null): void {
    if (!ip) return
    const now = Date.now()
    const recent = (this.hits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS)
    if (recent.length >= RATE_LIMIT) {
      throw new BadRequestException('Bạn đã gửi quá nhiều liên hệ, vui lòng thử lại sau.')
    }
    recent.push(now)
    this.hits.set(ip, recent)
    // Dọn IP hết hạn để Map không phình theo thời gian chạy.
    if (this.hits.size > 5000) {
      for (const [key, times] of this.hits) {
        if (times.every((at) => now - at >= RATE_WINDOW_MS)) this.hits.delete(key)
      }
    }
  }

  async submit(dto: CreateContactDto, ip: string | null): Promise<ContactMessage> {
    this.assertNotFlooding(ip)

    // Lưu trước: mail hỏng thì liên hệ vẫn còn trong DB để đội ngũ dò lại (notified = false).
    const saved = await this.contactRepo.save(
      this.contactRepo.create({ ...dto, email: dto.email.trim().toLowerCase(), ip }),
    )

    const inbox = process.env.CONTACT_INBOX_EMAIL?.trim()

    // 1) Báo nội bộ cho đội ngũ (nếu đã cấu hình hộp thư nhận liên hệ).
    if (inbox) {
      try {
        await this.mailService.sendEmail({
          to: inbox,
          // Reply-To = email khách, bấm "Trả lời" là trả thẳng cho họ. From luôn là domain của mình
          // để không hỏng SPF/DMARC.
          replyTo: saved.email,
          subject: `[Liên hệ] ${DEPARTMENT_LABEL[dto.department] ?? dto.department} — ${dto.subject}`,
          html: this.buildEmail(saved),
        })
        saved.notified = true
        await this.contactRepo.save(saved)
      } catch (error) {
        this.logger.error(`Không gửi được mail liên hệ nội bộ ${saved.id}`, error as Error)
      }
    } else {
      this.logger.warn('CONTACT_INBOX_EMAIL chưa cấu hình — liên hệ chỉ được lưu DB, không báo nội bộ')
    }

    // 2) Gửi mail xác nhận cho chính người liên hệ (độc lập với mail nội bộ:
    //    một cái hỏng không kéo cái kia hỏng theo).
    try {
      await this.mailService.sendEmail({
        to: saved.email,
        // Khách bấm "Trả lời" thì thư về hộp thư liên hệ của đội ngũ (nếu có), rơi về support mặc định.
        replyTo: inbox,
        subject: 'Mingo đã nhận được liên hệ của bạn',
        html: this.buildAcknowledgementEmail(saved),
      })
    } catch (error) {
      this.logger.error(`Không gửi được mail xác nhận cho khách ${saved.id}`, error as Error)
    }

    return saved
  }

  /** Mail xác nhận gửi lại cho người liên hệ — khớp design brand Mingo. */
  private buildAcknowledgementEmail(contact: ContactMessage): string {
    const departmentLabel = DEPARTMENT_LABEL[contact.department] ?? contact.department

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;color:${MINGO.muted};font-size:13px;width:150px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:${MINGO.brown};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`

    const content = `
      <p style="margin:0 0 18px;font-size:16px;color:${MINGO.brown};">Chào <strong>${escapeHtml(contact.fullName)}</strong>,</p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MINGO.brown};">
        Cảm ơn bạn đã liên hệ với Mingo! Hệ thống đã ghi nhận thông tin của bạn và tự động
        chuyển trực tiếp đến <strong>${escapeHtml(departmentLabel)}</strong>.
      </p>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${MINGO.brown};">
        Đội ngũ Mingo sẽ nghiên cứu nội dung và phản hồi qua email này hoặc số điện thoại
        <strong>${escapeHtml(contact.phone)}</strong> trong thời gian sớm nhất
        (không tính Thứ 7, Chủ Nhật &amp; Ngày lễ).
      </p>

      <p style="margin:0 0 10px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Nội dung bạn đã gửi</p>
      <div style="background:${MINGO.ivory};border:1px solid ${MINGO.border};border-radius:12px;padding:18px 20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Bộ phận', departmentLabel)}
          ${row('Tiêu đề', contact.subject)}
        </table>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${MINGO.border};color:${MINGO.brown};font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(contact.message)}</div>
      </div>
    `

    return renderMingoEmail(mingoBrandFromEnv(), {
      title: 'Mingo đã nhận được liên hệ của bạn',
      preheader: `Cảm ơn ${contact.fullName}, Mingo đã ghi nhận liên hệ của bạn.`,
      content,
    })
  }

  private buildEmail(contact: ContactMessage): string {
    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;color:${MINGO.muted};font-size:13px;width:150px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:${MINGO.brown};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`

    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;">Liên hệ mới</p>
      <h1 style="margin:0 0 18px;font-family:${MINGO_FONT};font-size:24px;font-weight:800;color:${MINGO.brown};">${escapeHtml(contact.subject)}</h1>
      <table style="width:100%;border-collapse:collapse;">
        ${row('Họ tên', contact.fullName)}
        ${row('Email', contact.email)}
        ${row('Số điện thoại', contact.phone)}
        ${row('Bộ phận', DEPARTMENT_LABEL[contact.department] ?? contact.department)}
        ${row('Thời gian', contact.createdAt.toLocaleString('vi-VN'))}
      </table>
      <div style="margin-top:20px;padding:16px;background:${MINGO.ivory};border-left:3px solid ${MINGO.orange};color:${MINGO.brown};font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(contact.message)}</div>
    `

    return renderMingoEmail(mingoBrandFromEnv(), {
      title: `Liên hệ mới - ${contact.subject}`,
      preheader: `${contact.fullName} · ${contact.email}`,
      content,
    })
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
