import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterMarketingContactDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'user-id-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  marketingOptIn: boolean;

  @ApiProperty({
    description: 'Optional tags to attach during registration',
    required: false,
    type: [String],
  })
  @IsOptional()
  tags?: string[];
}

