import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UserAddressesService } from './user-addresses.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import {
  UserAddressResponseDto,
  UserAddressListResponseDto,
} from './dto/user-address-response.dto';

@ApiTags('User Addresses')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard)
@Controller('me/addresses')
export class UserAddressesController {
  constructor(private readonly service: UserAddressesService) {}

  /** JWT payload signs `sub: user.id`; fall back defensively like OrdersController. */
  private userId(req: Request): string {
    const u: any = (req as any).user;
    return u?.sub ?? u?.id ?? u?.userId;
  }

  @Get()
  @ApiOperation({ operationId: 'getMyAddresses', summary: 'Danh sách sổ địa chỉ của tôi' })
  @ApiOkResponse({ type: UserAddressListResponseDto })
  async findAll(@Req() req: Request): Promise<UserAddressListResponseDto> {
    const items = await this.service.findAllByUser(this.userId(req));
    return {
      items: items.map((a) => UserAddressResponseDto.fromEntity(a)),
      total: items.length,
    };
  }

  @Post()
  @ApiOperation({ operationId: 'createMyAddress', summary: 'Thêm địa chỉ vào sổ' })
  @ApiCreatedResponse({ type: UserAddressResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc vượt giới hạn địa chỉ' })
  @ApiConflictResponse({ description: 'Địa chỉ đã tồn tại trong sổ địa chỉ' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    const address = await this.service.create(this.userId(req), dto);
    return UserAddressResponseDto.fromEntity(address);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getMyAddress', summary: 'Chi tiết một địa chỉ' })
  @ApiOkResponse({ type: UserAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy địa chỉ' })
  async findOne(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserAddressResponseDto> {
    const address = await this.service.findOneOrFail(this.userId(req), id);
    return UserAddressResponseDto.fromEntity(address);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateMyAddress', summary: 'Cập nhật địa chỉ' })
  @ApiOkResponse({ type: UserAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy địa chỉ' })
  @ApiConflictResponse({ description: 'Địa chỉ đã tồn tại trong sổ địa chỉ' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async update(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    const address = await this.service.update(this.userId(req), id, dto);
    return UserAddressResponseDto.fromEntity(address);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteMyAddress', summary: 'Xoá địa chỉ (soft delete)' })
  @ApiNoContentResponse({ description: 'Đã xoá địa chỉ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy địa chỉ' })
  async remove(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.service.remove(this.userId(req), id);
  }

  @Patch(':id/default')
  @ApiOperation({ operationId: 'setMyDefaultAddress', summary: 'Đặt làm địa chỉ mặc định' })
  @ApiOkResponse({ type: UserAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy địa chỉ' })
  async setDefault(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserAddressResponseDto> {
    const address = await this.service.setDefault(this.userId(req), id);
    return UserAddressResponseDto.fromEntity(address);
  }
}
