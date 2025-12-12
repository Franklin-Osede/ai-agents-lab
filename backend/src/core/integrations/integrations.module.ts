import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './webhook.service';

/**
 * Integrations Module
 * 
 * Provides integration services: webhooks, CRMs, etc.
 */
@Global()
@Module({
  imports: [HttpModule],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class IntegrationsModule {}



