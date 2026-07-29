import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  IsInt,
  IsUUID,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CAREER_APPLICATION_STATUSES = ['new', 'reviewing', 'rejected', 'hired'] as const;

export class ApplyCareerDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  full_name: string;

  @ApiProperty({ example: 'a@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_letter?: string;
}

export class UpdateCareerApplicationDto {
  @ApiProperty({ enum: CAREER_APPLICATION_STATUSES })
  @IsIn(CAREER_APPLICATION_STATUSES as unknown as string[])
  status: (typeof CAREER_APPLICATION_STATUSES)[number];
}

/** Receipt only — never echo the applicant's data back on a public endpoint. */
export class CareerApplicationReceiptDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;
}

export class CareerApplicationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  career_id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional({ nullable: true })
  cover_letter: string | null;

  @ApiProperty()
  cv_url: string;

  @ApiProperty({ enum: CAREER_APPLICATION_STATUSES })
  status: (typeof CAREER_APPLICATION_STATUSES)[number];

  @ApiProperty({ format: 'date-time' })
  created_at: Date;
}

/** Cross-job listing — carries the job it belongs to so admin can show one table. */
export class CareerApplicationListItemDto extends CareerApplicationDto {
  @ApiProperty({ description: 'Title of the job applied for' })
  career_title: string;

  @ApiProperty({ description: 'Slug of the job applied for' })
  career_slug: string;
}

export class CareerApplicationListDto {
  @ApiProperty({ type: [CareerApplicationListItemDto] })
  items: CareerApplicationListItemDto[];

  @ApiProperty({ nullable: true, description: 'Cursor token for the next page' })
  nextCursor: string | null;
}

export class QueryCareerApplicationDto {
  @ApiPropertyOptional({ enum: CAREER_APPLICATION_STATUSES })
  @IsOptional()
  @IsIn(CAREER_APPLICATION_STATUSES as unknown as string[])
  status?: (typeof CAREER_APPLICATION_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by job' })
  @IsOptional()
  @IsUUID()
  career_id?: string;

  @ApiPropertyOptional({ description: 'Search in applicant name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Cursor token for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
