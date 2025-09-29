import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto, UserResponseDto, UserListResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, role, profile } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({ 
      email, 
      password: password, // Keep original for compatibility
      passwordHash, 
      role,
      profile: profile || ''
    });
    
    const savedUser = await this.usersRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async findAll(queryDto: QueryUserDto): Promise<UserListResponseDto> {
    const { email, role, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    
    const where: any = {};
    if (email) {
      where.email = Like(`%${email}%`);
    }
    if (role) {
      where.role = role;
    }

    const options: FindManyOptions<User> = {
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [users, total] = await this.usersRepository.findAndCount(options);
    
    return {
      data: users.map(user => this.toResponseDto(user)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toResponseDto(user);
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { email, password, role, profile } = updateUserDto;
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (profile !== undefined) updateData.profile = profile;
    
    if (password) {
      updateData.password = password;
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    return this.toResponseDto(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.usersRepository.delete(id);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}