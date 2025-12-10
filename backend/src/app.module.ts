import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { BookingAgentModule } from './agents/booking-agent/booking-agent.module';
import { VoiceAgentModule } from './agents/voice-agent/voice-agent.module';
import { AbandonedCartModule } from './agents/abandoned-cart-agent/abandoned-cart.module';
import { WebinarRecoveryModule } from './agents/webinar-recovery-agent/webinar-recovery.module';
import { InvoiceChaserModule } from './agents/invoice-chaser-agent/invoice-chaser.module';
import { DemoModule } from './demo/demo.module';
import { MarketingModule } from './marketing/marketing.module';
import { BillingModule } from './billing/billing.module';
import { TenantIsolationMiddleware } from './core/security/tenant.middleware';

/**
 * Main Application Module
 *
 * This is a monorepo structure where:
 * - CoreModule: Provides shared infrastructure (AI, DB, etc.)
 * - Each Agent Module: Independent but uses CoreModule
 *
 * To add a new agent:
 * 1. Create folder in src/agents/new-agent/
 * 2. Implement domain, application, presentation layers
 * 3. Import module here
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CoreModule, // Shared infrastructure
    BookingAgentModule,
    VoiceAgentModule,
    AbandonedCartModule,
    WebinarRecoveryModule,
    InvoiceChaserModule,
    DemoModule, // Demo endpoints
    MarketingModule, // Lead capture
    BillingModule, // Billing and Stripe
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant isolation middleware to all routes except demo
    consumer
      .apply(TenantIsolationMiddleware)
      .exclude('demo/(.*)', 'health/(.*)')
      .forRoutes('*');
  }
}
