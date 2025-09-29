import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Role } from '../../../auth/role.enum';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Search by email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: Role,
    example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
