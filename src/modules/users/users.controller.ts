import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, UserResponseDto, UserListResponseDto } from './dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account. Only admins can create users.',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users with optional filtering and sorting.',
  })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by email (partial match)' })
  @ApiQuery({ name: 'phoneNumber', required: false, description: 'Filter by phone number (partial match)' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filter by role' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  async findAll(@Query() queryDto: QueryUserDto): Promise<UserListResponseDto> {
    console.log(`QueryDto: ${queryDto}`);
    return this.usersService.findAll(queryDto);
  }

  @Get(':id')
  // @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID.',
  })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', type: 'string', example: '68b7ec4d-1d02-df24-e5d3-3793abcd1234' })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information. Only admins can update users.',
  })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', type: 'string', example: '68b7ec4d-1d02-df24-e5d3-3793abcd1234' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user account. Only admins can delete users.',
  })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', type: 'string', example: '68b7ec4d-1d02-df24-e5d3-3793abcd1234' })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
