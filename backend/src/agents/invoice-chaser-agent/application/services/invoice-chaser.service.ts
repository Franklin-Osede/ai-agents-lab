import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { IInvoiceRepository } from '../../domain/interfaces/invoice-repository.interface';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { VoiceChannel } from '../../../voice-agent/domain/value-objects/voice-message';
import { Invoice, EscalationLevel } from '../../domain/entities/invoice.entity';

@Injectable()
export class InvoiceChaserService {
  private readonly logger = new Logger(InvoiceChaserService.name);

  constructor(
    @Inject('IInvoiceRepository') private readonly invoiceRepository: IInvoiceRepository,
    private readonly voiceAgentService: VoiceAgentService,
  ) {}

  async chaseInvoices(): Promise<Result<string>> {
    try {
      const invoices = await this.invoiceRepository.findOverdueInvoices();

      if (invoices.length === 0) {
        return Result.ok('No overdue invoices found.');
      }

      this.logger.log(`Found ${invoices.length} overdue invoices. Processing...`);

      for (const invoice of invoices) {
        await this.processInvoice(invoice);
      }

      return Result.ok(`Processed ${invoices.length} overdue invoices`);
    } catch (error) {
      this.logger.error(`Failed to chase invoices: ${(error as Error).message}`);
      return Result.fail(error as Error);
    }
  }

  private async processInvoice(invoice: Invoice): Promise<void> {
    // Determine next step
    // Simplified logic: Always escalate to next level for this demo
    const nextLevel = invoice.escalationLevel + 1;

    this.logger.log(`Escalating invoice ${invoice.id} to level ${nextLevel}`);

    switch (nextLevel) {
      case EscalationLevel.GENTLE_REMINDER:
        // Mock Email
        this.logger.log(`[MOCK EMAIL] Sending gentle reminder for invoice ${invoice.id}`);
        break;

      case EscalationLevel.URGENT_MESSAGE:
        // WhatsApp Text/Voice
        await this.generateChaserMessage(invoice, 'Urgent payment reminder: This is now overdue.');
        break;

      case EscalationLevel.FINAL_NOTICE_CALL:
        // Voice Call (Video optional)
        await this.generateChaserMessage(invoice, 'FINAL NOTICE. Urgent action required.', true);
        break;

      default:
        this.logger.log(`Max escalation reached for invoice ${invoice.id}`);
        return;
    }

    invoice.escalate();
    await this.invoiceRepository.save(invoice);
  }

  private async generateChaserMessage(
    invoice: Invoice,
    context: string,
    isCall = false,
  ): Promise<void> {
    const voiceResult = await this.voiceAgentService.generateVoiceMessage({
      customerId: invoice.customerId,
      businessId: 'catering-co',
      context: `Invoice ${invoice.id} for $${invoice.amount}. ${context}`,
      channel: VoiceChannel.WHATSAPP,
      includeVideo: isCall,
    });

    if (voiceResult.isFailure) {
      this.logger.error(`Failed to generate chaser message: ${voiceResult.error}`);
    } else {
      this.logger.log(`Chaser message generated: ${voiceResult.value.audioUrl}`);
    }
  }
}
