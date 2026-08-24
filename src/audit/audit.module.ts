import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditContextMiddleware } from './audit-context.middleware';
import { AuditListener } from './audit.listener';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './audit.subscriber';

@Module({
  imports: [EventEmitterModule.forRoot(), TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditListener, AuditSubscriber],
})
export class AuditModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
