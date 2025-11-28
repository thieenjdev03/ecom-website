import { Body, Controller, Get, Param, Patch, Req, UseGuards, ParseUUIDPipe, Put, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Addresses')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard, RolesGuard)
@Controller('users/:userId/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses of a user' })
  @ApiOkResponse({ description: 'Addresses fetched successfully' })
  @ApiParam({ name: 'userId', description: 'User ID (uuid)', example: '68b7ec4d-1d02-df24-e5d3-3793abcd1234' })
  async getByUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.addressesService.findByUserId(userId);
  }

  @Patch(':addressId')
  @ApiOperation({ summary: 'Update address for user' })
  @ApiOkResponse({ description: 'Address updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN' })
  async update(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Param('addressId', new ParseUUIDPipe({ version: '4' })) addressId: string,
    @Body() dto: UpdateAddressDto,
    @Req() req: any,
  ) {
    return this.addressesService.update(userId, addressId, dto, req.user);
  }

  @Put('shipping')
  @ApiOperation({ summary: 'Create or update default shipping address for user' })
  @ApiOkResponse({ description: 'Shipping address synced successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN' })
  async upsertShipping(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateAddressDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const isOwner = currentUser?.sub === userId;
    const isAdmin = currentUser?.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('FORBIDDEN');
    }

    return this.addressesService.upsertByUser(userId, dto);
  }
}


