import { Module, Global } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { DomainWhitelistService } from './domain-whitelist.service';

/**
 * Security Module
 *
 * Provides security services: API key management, domain whitelisting, tenant isolation
 */
@Global()
@Module({
  providers: [ApiKeyService, ApiKeyGuard, DomainWhitelistService],
  exports: [ApiKeyService, ApiKeyGuard, DomainWhitelistService],
})
export class SecurityModule {}




