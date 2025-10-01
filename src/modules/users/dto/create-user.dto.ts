import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../auth/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })

  @ApiProperty({
    description: 'User phone number',
    example: '0909090909',
  })
  @IsString()
  phoneNumber: string;

  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  profile?: string;
}