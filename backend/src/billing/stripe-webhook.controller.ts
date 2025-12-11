import { Controller, Post, Req, Res, HttpCode, HttpStatus, Logger, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import Stripe from 'stripe';

/**
 * Stripe Webhook Controller
 * 
 * Handles Stripe webhook events (payments, subscriptions, etc.)
 */
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      this.logger.warn('No stripe-signature header');
      return res.status(400).send('No signature');
    }

    try {
      // TODO: Verify webhook signature
      // const event = this.stripe.webhooks.constructEvent(
      //   req.rawBody,
      //   sig,
      //   process.env.STRIPE_WEBHOOK_SECRET
      // );

      // For now, parse from body (in production, use constructEvent)
      const event = req.body as Stripe.Event;

      await this.billingService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      this.logger.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


