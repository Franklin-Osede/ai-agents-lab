import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbandonedCartController } from './presentation/abandoned-cart.controller';
import { RecoverCartService } from './application/services/recover-cart.service';
import { PostgresCartRepository } from './infrastructure/repositories/postgres-cart.repository';
import { VoiceAgentModule } from '../voice-agent/voice-agent.module';
import { Cart } from './domain/entities/cart.entity';

@Module({
  imports: [
    VoiceAgentModule,
    TypeOrmModule.forFeature([Cart]),
  ],
  controllers: [AbandonedCartController],
  providers: [
    RecoverCartService,
    {
      provide: 'ICartRepository',
      useClass: PostgresCartRepository,
    },
  ],
  exports: [RecoverCartService],
})
export class AbandonedCartModule {}
