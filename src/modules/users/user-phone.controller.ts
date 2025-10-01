import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UserPhoneService } from './user-phone.service';
import { CreatePhoneNumberDto, UpdatePhoneNumberDto } from './dto/phone-number.dto';

@Controller('user/phones')
@UseGuards(JwtGuard)
export class UserPhoneController {
  constructor(private readonly phoneService: UserPhoneService) {}

  @Get()
  findAll(@Request() req) {
    return this.phoneService.findAllByUser(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreatePhoneNumberDto) {
    return this.phoneService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePhoneNumberDto) {
    return this.phoneService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.phoneService.delete(req.user.id, id);
    return { message: 'Phone number deleted successfully' };
  }

  @Patch(':id/set-primary')
  setPrimary(@Request() req, @Param('id') id: string) {
    return this.phoneService.setPrimary(req.user.id, id);
  }
}

