import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SiteSettingsDto, UpdateSiteSettingsDto } from './dto/site-settings.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Các link cấu hình của storefront (public)' })
  @ApiOkResponse({ type: SiteSettingsDto })
  findAll(): Promise<SiteSettingsDto> {
    return this.settingsService.findAll();
  }

  @Patch()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật link cấu hình (admin). Chuỗi rỗng = xoá link.' })
  @ApiOkResponse({ type: SiteSettingsDto })
  update(@Body() dto: UpdateSiteSettingsDto): Promise<SiteSettingsDto> {
    return this.settingsService.update(dto);
  }
}
