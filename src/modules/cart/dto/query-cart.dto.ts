import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCartDto {
  @ApiPropertyOptional({
    example: 'vi',
    description: 'Locale used to resolve product name/slug (default: en)',
    enum: ['en', 'vi'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'vi'])
  locale?: string = 'en';
}
