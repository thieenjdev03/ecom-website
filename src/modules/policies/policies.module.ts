import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from './entities/policy.entity';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PoliciesPublicController } from './policies.public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  controllers: [PoliciesController, PoliciesPublicController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
