import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from './api-key.entity';
import { Tenant, TenantStatus, TenantPlan } from './tenant.entity';

/**
 * API Key Service
 * 
 * Handles secure generation, validation, and management of API keys
 */
@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly KEY_PREFIX = 'sk_live_';
  
  // In-memory storage (replace with database in production)
  private apiKeys: Map<string, ApiKey> = new Map();
  private tenants: Map<string, Tenant> = new Map();
  
  /**
   * Generate a new API key for a tenant
   */
  async generateApiKey(
    tenantId: string,
    scopes: string[] = ['*'], // Default: all scopes
    rateLimit: number = 1000, // Default: 1000 requests/hour
  ): Promise<{ apiKey: string; apiKeyEntity: ApiKey }> {
    // Generate secure random key
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `${this.KEY_PREFIX}${randomBytes.toString('base64url')}`;
    
    // Hash the key (never store plain text)
    const keyHash = await bcrypt.hash(apiKey, this.SALT_ROUNDS);
    
    // Extract prefix for identification
    const keyPrefix = apiKey.substring(0, this.KEY_PREFIX.length + 8);
    
    // Create API key entity
    const apiKeyEntity = new ApiKey({
      tenantId,
      keyPrefix,
      keyHash,
      scopes,
      rateLimit,
      expiresAt: null,
      lastUsedAt: null,
      isActive: true,
    });
    
    // Store (in production, save to database)
    this.apiKeys.set(apiKeyEntity.id, apiKeyEntity);
    
    this.logger.log(`Generated API key for tenant ${tenantId}`);
    
    // Return both the plain key (only shown once) and entity
    return { apiKey, apiKeyEntity };
  }
  
  /**
   * Validate an API key and return the associated tenant
   */
  async validateApiKey(apiKey: string): Promise<Tenant | null> {
    if (!apiKey || !apiKey.startsWith(this.KEY_PREFIX)) {
      return null;
    }
    
    // Extract prefix for faster lookup
    const prefix = apiKey.substring(0, this.KEY_PREFIX.length + 8);
    
    // Find API key by prefix (in production, use database index)
    let foundKey: ApiKey | null = null;
    for (const [id, key] of this.apiKeys.entries()) {
      if (key.keyPrefix === prefix && key.isActive) {
        foundKey = key;
        break;
      }
    }
    
    if (!foundKey) {
      this.logger.warn(`API key not found: ${prefix}...`);
      return null;
    }
    
    // Check expiration
    if (foundKey.isExpired()) {
      this.logger.warn(`API key expired: ${foundKey.id}`);
      return null;
    }
    
    // Verify hash (constant-time comparison)
    const isValid = await bcrypt.compare(apiKey, foundKey.keyHash);
    if (!isValid) {
      this.logger.warn(`Invalid API key hash: ${foundKey.id}`);
      return null;
    }
    
    // Get tenant
    const tenant = this.tenants.get(foundKey.tenantId);
    if (!tenant) {
      this.logger.warn(`Tenant not found: ${foundKey.tenantId}`);
      return null;
    }
    
    // Check tenant status
    if (!tenant.isActive()) {
      this.logger.warn(`Tenant not active: ${tenant.id}`);
      return null;
    }
    
    // Update last used
    foundKey.lastUsedAt = new Date();
    this.apiKeys.set(foundKey.id, foundKey);
    
    return tenant;
  }
  
  /**
   * Check if API key has required scope
   */
  async hasScope(apiKey: string, requiredScope: string): Promise<boolean> {
    const prefix = apiKey.substring(0, this.KEY_PREFIX.length + 8);
    
    for (const [id, key] of this.apiKeys.entries()) {
      if (key.keyPrefix === prefix && key.isActive) {
        return key.hasScope(requiredScope);
      }
    }
    
    return false;
  }
  
  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKey: string): Promise<boolean> {
    const prefix = apiKey.substring(0, this.KEY_PREFIX.length + 8);
    
    for (const [id, key] of this.apiKeys.entries()) {
      if (key.keyPrefix === prefix) {
        key.isActive = false;
        this.apiKeys.set(id, key);
        this.logger.log(`Revoked API key: ${id}`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get API key by tenant ID (for management)
   */
  getApiKeysByTenant(tenantId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter(
      key => key.tenantId === tenantId && key.isActive
    );
  }
  
  /**
   * Create a test tenant (for development)
   */
  createTestTenant(name: string, domains: string[] = []): Tenant {
    const tenant = new Tenant({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      status: 'active' as TenantStatus,
      plan: 'starter' as TenantPlan,
      allowedDomains: domains,
      settings: {},
    });
    
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }
}
