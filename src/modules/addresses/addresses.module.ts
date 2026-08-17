import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './address.entity';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';

// The address-book (sổ địa chỉ) controller/service live here rather than in a
// separate UserAddressesModule because they operate on the same `Address` entity
// — see NOTES-address-trace.md. UserAddressesService is exported for OrdersModule.
@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  controllers: [AddressesController, UserAddressesController],
  providers: [AddressesService, UserAddressesService],
  exports: [AddressesService, UserAddressesService],
})
export class AddressesModule {}


