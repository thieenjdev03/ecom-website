import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../auth/enums/role.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+84 901234567',
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: 'John Doe',
  })
  profile?: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'User addresses',
    type: 'array',
  })
  addresses?: any[];

  @ApiPropertyOptional({
    description: 'User orders',
    type: 'array',
  })
  orders?: any[];

  @ApiPropertyOptional({
    description: 'User wishlists',
    type: 'array',
  })
  wishlists?: any[];

  @ApiPropertyOptional({
    description: 'User cart',
    type: 'array',
  })
  cart?: any[];

  @ApiPropertyOptional({
    description: 'User payments',
    type: 'array',
  })
  payments?: any[];
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}
