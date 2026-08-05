import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto } from './dto';

@ApiTags('Me')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard)
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const payload: any = (req as any).user; // payload contains sub
    const userId: string = payload?.sub;
    // findOne maps through the whitelist DTO — never exposes password/refresh hashes.
    return this.usersService.findOne(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Current user profile updated', type: UserResponseDto })
  async updateMe(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const payload: any = (req as any).user;
    const userId: string = payload?.sub;
    return this.usersService.updateSelf(userId, updateUserDto);
  }
}


