import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

/**
 * Webhook Service
 *
 * Sends webhooks with HMAC signature for security
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Sign payload with HMAC SHA256
   */
  private signPayload(payload: unknown, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Send webhook to URL with signature
   */
  async sendWebhook(
    url: string,
    payload: unknown,
    secret?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = Date.now();
      const body = {
        ...payload,
        timestamp,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add signature if secret provided
      if (secret) {
        const signature = this.signPayload(body, secret);
        headers['X-Signature'] = signature;
        headers['X-Timestamp'] = timestamp.toString();
      }

      await firstValueFrom(this.httpService.post(url, body, { headers, timeout: 5000 }));

      this.logger.log(`Webhook sent successfully to ${url}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(payload: unknown, signature: string, secret: string): boolean {
    const expectedSignature = this.signPayload(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
