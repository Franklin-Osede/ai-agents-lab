import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeWebhookController } from './stripe-webhook.controller';

/**
 * Billing Module
 *
 * Handles subscriptions, payments, and Stripe integration
 */
@Module({
  providers: [BillingService],
  controllers: [StripeWebhookController],
  exports: [BillingService],
})
export class BillingModule {}
