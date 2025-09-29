import { IsOptional, IsString, MinLength, IsEnum, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../auth/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'newemail@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User password (minimum 6 characters)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'Updated Profile',
  })
  @IsOptional()
  @IsString()
  profile?: string;
}