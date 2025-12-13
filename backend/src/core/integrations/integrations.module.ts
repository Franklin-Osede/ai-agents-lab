import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './webhook.service';
import { WhatsAppService } from './whatsapp.service';
import { EmailPreviewService } from './email-preview.service';

/**
 * Integrations Module
 *
 * Provides integration services: webhooks, CRMs, WhatsApp, Email, etc.
 */
@Global()
@Module({
  imports: [HttpModule],
  providers: [WebhookService, WhatsAppService, EmailPreviewService],
  exports: [WebhookService, WhatsAppService, EmailPreviewService],
})
export class IntegrationsModule {}
