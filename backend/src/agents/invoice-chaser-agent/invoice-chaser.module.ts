import { Module } from '@nestjs/common';
import { InvoiceChaserController } from './presentation/invoice-chaser.controller';
import { InvoiceChaserService } from './application/services/invoice-chaser.service';
import { InMemoryInvoiceRepository } from './infrastructure/repositories/in-memory-invoice.repository';
import { VoiceAgentModule } from '../voice-agent/voice-agent.module';

@Module({
  imports: [VoiceAgentModule],
  controllers: [InvoiceChaserController],
  providers: [
    InvoiceChaserService,
    {
      provide: 'IInvoiceRepository',
      useClass: InMemoryInvoiceRepository,
    },
  ],
  exports: [InvoiceChaserService],
})
export class InvoiceChaserModule {}
