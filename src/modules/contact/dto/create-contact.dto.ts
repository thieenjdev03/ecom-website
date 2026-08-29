import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator'

/** Phải khớp `createContactFormSchema` của storefront (src/features/contact/schema.ts). */
export const CONTACT_DEPARTMENTS = ['customerCare', 'business', 'orderComplaint', 'other'] as const

export class CreateContactDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName!: string

  @ApiProperty({ example: 'khach@gmail.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string

  @ApiProperty({ example: '0901234567' })
  @Matches(/^(?:0\d{9,10}|\+84\d{9,10})$/, { message: 'Số điện thoại không hợp lệ' })
  phone!: string

  @ApiProperty({ enum: CONTACT_DEPARTMENTS, enumName: 'ContactDepartment' })
  @IsIn(CONTACT_DEPARTMENTS as unknown as string[])
  department!: string

  @ApiProperty({ example: 'Hỏi về đặt hàng số lượng lớn' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject!: string

  @ApiProperty({ example: 'Shop cho mình hỏi...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string
}
