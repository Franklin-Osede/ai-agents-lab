import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Billing Service
 *
 * Handles Stripe integration for subscriptions and payments
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-12-15.clover',
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set, billing features disabled');
    }
  }

  /**
   * Create Stripe Checkout Session for subscription
   */
  async createCheckoutSession(data: {
    tenantId: string;
    email: string;
    plan: 'starter' | 'pro' | 'enterprise';
  }): Promise<{ url: string; sessionId: string } | null> {
    if (!this.stripe) {
      this.logger.error('Stripe not configured');
      return null;
    }

    try {
      const prices = {
        starter: this.configService.get<string>('STRIPE_PRICE_STARTER', 'price_starter'),
        pro: this.configService.get<string>('STRIPE_PRICE_PRO', 'price_pro'),
        enterprise: this.configService.get<string>('STRIPE_PRICE_ENTERPRISE', 'price_enterprise'),
      };

      const session = await this.stripe.checkout.sessions.create({
        customer_email: data.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: prices[data.plan],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/dashboard?canceled=true`,
        metadata: {
          tenantId: data.tenantId,
          plan: data.plan,
        },
      });

      this.logger.log(`Checkout session created: ${session.id} for tenant ${data.tenantId}`);

      return {
        url: session.url || '',
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      return null;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Received webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) {
      this.logger.warn('No tenantId in session metadata');
      return;
    }

    this.logger.log(`Checkout completed for tenant ${tenantId}`);

    // TODO: Update tenant status to 'active'
    // TODO: Update lead status to 'active' and set convertedAt
    // TODO: Store subscription ID
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // TODO: Update tenant subscription status
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // TODO: Update tenant status to 'suspended' or 'inactive'
  }
}




