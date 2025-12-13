import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

/**
 * API Key Guard
 *
 * Validates API key from request headers and injects tenant into request
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Validate API key and get tenant
    const tenant = await this.apiKeyService.validateApiKey(apiKey);

    if (!tenant) {
      this.logger.warn(`Invalid API key from IP: ${request.ip}`);
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Inject tenant into request for use in controllers
    request['tenant'] = tenant;
    request['tenantId'] = tenant.id;
    request['apiKey'] = apiKey;

    return true;
  }

  /**
   * Extract API key from request headers
   * Supports: Authorization: Bearer <key> or X-API-Key: <key>
   */
  private extractApiKey(request: { headers: Record<string, string | undefined> }): string | null {
    // Try Authorization header first
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }
}
