import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email Service
 * 
 * Sends transactional emails (welcome, follow-ups, etc.)
 * Uses SendGrid (can be swapped for Mailchimp, etc.)
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly sendGridApiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@agentslab.ai');
    this.sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY') || null;
  }

  /**
   * Send welcome email with API key
   */
  async sendWelcomeEmail(data: {
    to: string;
    name: string;
    apiKey: string;
    trialDays: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement SendGrid integration
      // For now, just log
      this.logger.log(`Would send welcome email to ${data.to} with API key`);
      
      if (this.sendGridApiKey) {
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(this.sendGridApiKey);
        // await sgMail.send({...});
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error sending welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send follow-up email
   */
  async sendFollowUp(data: {
    to: string;
    name: string;
    type: 'day3' | 'day7' | 'day10' | 'day14';
    trialDaysRemaining?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = {
        day3: {
          subject: 'Tips para usar tu agente AI',
          html: `
            <h1>Hola ${data.name},</h1>
            <p>Aquí tienes algunos tips para sacar el máximo provecho de tu agente:</p>
            <ul>
              <li>Personaliza los horarios de tu negocio</li>
              <li>Configura tus servicios</li>
              <li>Conecta con tu calendario</li>
            </ul>
            <a href="https://agentslab.ai/dashboard">Ir al Dashboard</a>
          `,
        },
        day7: {
          subject: 'Casos de éxito con nuestros agentes',
          html: `
            <h1>Hola ${data.name},</h1>
            <p>Mira cómo otros negocios están usando nuestros agentes:</p>
            <p>Clínica X aumentó reservas 40%</p>
            <p>Tienda Y recuperó €5,000 en carritos</p>
            <a href="https://agentslab.ai/dashboard">Ver tu dashboard</a>
          `,
        },
        day10: {
          subject: `Tu trial termina en ${data.trialDaysRemaining} días`,
          html: `
            <h1>Hola ${data.name},</h1>
            <p>Tu periodo de prueba termina pronto.</p>
            <p>¿Quieres continuar? Elige un plan:</p>
            <a href="https://agentslab.ai/pricing">Ver Planes</a>
          `,
        },
        day14: {
          subject: 'Último día de trial - ¿Continuamos?',
          html: `
            <h1>Hola ${data.name},</h1>
            <p>Hoy es tu último día de trial.</p>
            <p>Si quieres continuar, elige un plan ahora:</p>
            <a href="https://agentslab.ai/pricing">Elegir Plan</a>
          `,
        },
      };

      const template = templates[data.type];
      
      // TODO: Implement SendGrid
      this.logger.log(`Would send ${data.type} follow-up to ${data.to}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error sending follow-up email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
