import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Tenant } from './tenant.entity';

/**
 * Domain Whitelist Service
 *
 * Validates that requests come from authorized domains
 */
@Injectable()
export class DomainWhitelistService {
  private readonly logger = new Logger(DomainWhitelistService.name);

  /**
   * Validate that the request origin is allowed for the tenant
   */
  validateDomain(tenant: Tenant, origin: string | undefined): boolean {
    // If no origin (server-to-server), allow
    if (!origin) {
      return true;
    }

    // If tenant has no domain restrictions, allow
    if (!tenant.allowedDomains || tenant.allowedDomains.length === 0) {
      return true;
    }

    try {
      const originUrl = new URL(origin);
      const originDomain = originUrl.hostname;

      // Check if domain is in whitelist
      const isAllowed = tenant.isDomainAllowed(originDomain);

      if (!isAllowed) {
        this.logger.warn(`Domain not whitelisted: ${originDomain} for tenant ${tenant.id}`);
      }

      return isAllowed;
    } catch (error) {
      this.logger.error(`Invalid origin URL: ${origin}`, error);
      return false;
    }
  }

  /**
   * Validate domain and throw exception if not allowed
   */
  validateDomainOrThrow(tenant: Tenant, origin: string | undefined): void {
    if (!this.validateDomain(tenant, origin)) {
      throw new UnauthorizedException(
        `Domain ${origin} is not authorized for this API key. ` +
          `Please add it to your allowed domains in the dashboard.`,
      );
    }
  }
}
