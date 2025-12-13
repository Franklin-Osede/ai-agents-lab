import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './infrastructure/ai/openai.provider';
import { LangChainProvider } from './infrastructure/ai/langchain.provider';
import { IAiProvider, AI_PROVIDER_TOKEN } from './domain/agents/interfaces/ai-provider.interface';
import { HealthModule } from './shared/health/health.module';
import { SecurityModule } from './security/security.module';
import { IntegrationsModule } from './integrations/integrations.module';

/**
 * Core Module - Provides shared infrastructure and domain services
 * This module is Global so all agents can use it without importing
 *
 * Supports selecting AI provider via AI_PROVIDER_TOKEN env var:
 * - 'langchain' -> LangChainProvider (with memory and tools support)
 * - 'openai' or default -> OpenAiProvider (simple, backward compatible)
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
    SecurityModule,
    IntegrationsModule,
  ],
  providers: [
    OpenAiProvider,
    LangChainProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (
        configService: ConfigService,
        openAiProvider: OpenAiProvider,
        langChainProvider: LangChainProvider,
      ): IAiProvider => {
        const providerType = configService.get<string>('AI_PROVIDER', 'openai').toLowerCase();

        if (providerType === 'langchain') {
          return langChainProvider;
        }

        return openAiProvider;
      },
      inject: [ConfigService, OpenAiProvider, LangChainProvider],
    },
    {
      provide: 'IAiProvider',
      useFactory: (
        configService: ConfigService,
        openAiProvider: OpenAiProvider,
        langChainProvider: LangChainProvider,
      ): IAiProvider => {
        const providerType = configService.get<string>('AI_PROVIDER', 'openai').toLowerCase();

        if (providerType === 'langchain') {
          return langChainProvider;
        }

        return openAiProvider;
      },
      inject: [ConfigService, OpenAiProvider, LangChainProvider],
    },
  ],
  exports: [AI_PROVIDER_TOKEN, 'IAiProvider', LangChainProvider, OpenAiProvider],
})
export class CoreModule {}
