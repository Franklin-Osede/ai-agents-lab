import { BaseEntity } from '../domain/shared/entities/base.entity';

/**
 * API Key Entity
 * 
 * Represents an API key for a tenant with security features:
 * - Hash stored (never plain text)
 * - Scopes for granular permissions
 * - Rate limiting configuration
 * - Expiration support
 */
export class ApiKey extends BaseEntity {
  tenantId: string;
  keyPrefix: string; // First 8 chars for identification (e.g., "sk_live_")
  keyHash: string; // Bcrypt hash of the full key
  scopes: string[]; // e.g., ['agent:booking', 'agent:cart-recovery']
  rateLimit: number; // Requests per hour
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
  
  constructor(partial: Partial<ApiKey>) {
    super();
    Object.assign(this, partial);
  }
  
  /**
   * Check if API key is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }
  
  /**
   * Check if API key has access to a specific scope
   */
  hasScope(scope: string): boolean {
    return this.scopes.includes(scope) || this.scopes.includes('*');
  }
}


