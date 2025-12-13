import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

export interface WhatsAppMessage {
  to: string; // Número en formato E.164 (ej: +34612345678)
  message: string;
  mediaUrl?: string; // URL opcional para enviar audio/video
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * WhatsApp Service
 *
 * Envía mensajes reales de WhatsApp usando Twilio
 * Requiere configuración de Twilio WhatsApp Sandbox o WhatsApp Business API
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly twilioClient: ReturnType<typeof twilio> | null = null;
  private readonly twilioWhatsAppNumber: string | null = null;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioWhatsAppNumber = this.configService.get<string>(
      'TWILIO_WHATSAPP_NUMBER',
      'whatsapp:+14155238886',
    ); // Sandbox default

    this.isEnabled = !!(accountSid && authToken);

    if (this.isEnabled) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('WhatsApp Service initialized with Twilio');
    } else {
      this.logger.warn(
        'WhatsApp Service disabled: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN',
      );
    }
  }

  /**
   * Envía un mensaje de texto por WhatsApp
   */
  async sendTextMessage(data: WhatsAppMessage): Promise<WhatsAppSendResult> {
    if (!this.isEnabled || !this.twilioClient) {
      this.logger.warn(
        `[SIMULATED] Would send WhatsApp to ${data.to}: ${data.message.substring(0, 50)}...`,
      );
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    try {
      // Asegurar formato correcto del número
      const toNumber = data.to.startsWith('whatsapp:') ? data.to : `whatsapp:${data.to}`;

      const message = await this.twilioClient.messages.create({
        from: this.twilioWhatsAppNumber!,
        to: toNumber,
        body: data.message,
      });

      this.logger.log(`WhatsApp message sent successfully. SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Envía un mensaje con media (audio/video/imagen) por WhatsApp
   */
  async sendMediaMessage(data: WhatsAppMessage): Promise<WhatsAppSendResult> {
    if (!this.isEnabled || !this.twilioClient) {
      this.logger.warn(`[SIMULATED] Would send WhatsApp media to ${data.to}: ${data.mediaUrl}`);
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    if (!data.mediaUrl) {
      return {
        success: false,
        error: 'mediaUrl is required for media messages',
      };
    }

    try {
      const toNumber = data.to.startsWith('whatsapp:') ? data.to : `whatsapp:${data.to}`;

      const message = await this.twilioClient.messages.create({
        from: this.twilioWhatsAppNumber!,
        to: toNumber,
        body: data.message || 'Mensaje de audio',
        mediaUrl: [data.mediaUrl],
      });

      this.logger.log(`WhatsApp media message sent successfully. SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp media message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verifica si el servicio está habilitado
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
