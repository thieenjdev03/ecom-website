import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { MarketingSource } from '../entities/marketing-contact.entity';

const SOURCE_VALUES: MarketingSource[] = ['register', 'modal', 'checkout', 'import'];

export class SubscribeDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'modal',
    enum: SOURCE_VALUES,
    required: false,
    default: 'modal',
  })
  @IsOptional()
  @IsIn(SOURCE_VALUES)
  source?: MarketingSource;
}

