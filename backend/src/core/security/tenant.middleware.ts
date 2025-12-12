import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DomainWhitelistService } from './domain-whitelist.service';
import { Tenant } from './tenant.entity';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
      apiKey?: string;
      tenantContext?: {
        tenantId: string;
        tenantName: string;
        plan: string;
      };
    }
  }
}

/**
 * Tenant Isolation Middleware
 * 
 * Ensures tenant is injected in request and validates domain whitelist
 * This should run AFTER ApiKeyGuard
 */
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantIsolationMiddleware.name);

  constructor(private readonly domainWhitelistService: DomainWhitelistService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenant = req['tenant'];
    
    if (!tenant) {
      // If no tenant, might be a public endpoint (like demo)
      // Let it pass, guards will handle authorization
      return next();
    }
    
    // Validate domain whitelist (for widget requests)
    const origin = req.headers['origin'];
    try {
      this.domainWhitelistService.validateDomainOrThrow(tenant, origin);
    } catch (error) {
      // Log but don't block if it's a server-to-server request
      if (origin) {
        throw error;
      }
    }
    
    // Ensure tenantId is always available in request
    if (!req['tenantId']) {
      req['tenantId'] = tenant.id;
    }
    
    // Add tenant context to request for logging
    req['tenantContext'] = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan,
    };
    
    next();
  }
}



