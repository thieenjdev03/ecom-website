import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';

@ApiTags('Me')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard)
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: User })
  async getMe(@Req() req: Request): Promise<User> {
    const payload: any = (req as any).user; // payload contains sub
    const userId: string = payload?.sub;
    return this.usersService.findFullEntity(userId);
  }
}


