import { BaseEntity } from '../domain/shared/entities/base.entity';

/**
 * Tenant Entity
 *
 * Represents a business/organization using the platform
 */
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  INACTIVE = 'inactive',
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  INTERNAL = 'internal', // For internal use (free, unlimited)
}

export interface TenantSettings {
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
  businessHours?: {
    [key: string]: { start: string; end: string };
  };
  timezone?: string;
  [key: string]: unknown;
}

export class Tenant extends BaseEntity {
  name: string;
  slug: string; // URL-friendly identifier
  status: TenantStatus;
  plan: TenantPlan;
  allowedDomains: string[]; // Whitelist of domains for widget
  settings: TenantSettings; // Branding, config, etc.
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  constructor(partial: Partial<Tenant>) {
    super();
    Object.assign(this, partial);
  }

  /**
   * Check if tenant is active
   */
  isActive(): boolean {
    return this.status === TenantStatus.ACTIVE || this.status === TenantStatus.TRIAL;
  }

  /**
   * Check if domain is allowed
   */
  isDomainAllowed(domain: string): boolean {
    if (this.allowedDomains.length === 0) return true; // No restrictions
    return this.allowedDomains.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
    );
  }
}




