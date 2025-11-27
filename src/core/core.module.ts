import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiProvider } from './infrastructure/ai/openai.provider';
import { IAiProvider, AI_PROVIDER_TOKEN } from './domain/agents/interfaces/ai-provider.interface';
import { HealthModule } from './shared/health/health.module';

/**
 * Core Module - Provides shared infrastructure and domain services
 * This module is Global so all agents can use it without importing
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
  ],
  providers: [
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: OpenAiProvider,
    },
  ],
  exports: [AI_PROVIDER_TOKEN],
})
export class CoreModule {}
