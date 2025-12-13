import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailPreviewData {
  to: string;
  toName: string;
  subject: string;
  cartItems: Array<{ name: string; quantity: number; price: number }>;
  cartTotal: number;
  discountCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  expirationHours?: number;
  recoveryLink?: string;
}

export interface EmailPreviewResult {
  html: string;
  text: string;
  subject: string;
  previewUrl?: string; // URL para ver el preview en el frontend
}

/**
 * Email Preview Service
 *
 * Genera HTML de emails sin enviarlos realmente
 * Perfecto para demostraciones y desarrollo
 */
@Injectable()
export class EmailPreviewService {
  private readonly logger = new Logger(EmailPreviewService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  }

  /**
   * Genera un preview de email de recuperación de carrito
   */
  generateCartRecoveryEmail(data: EmailPreviewData): EmailPreviewResult {
    const discountText = this.getDiscountText(data);
    const expirationText = data.expirationHours
      ? `Esta oferta expira en ${data.expirationHours} horas.`
      : 'Esta oferta es por tiempo limitado.';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #135bec 0%, #0d47a1 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #135bec;
    }
    .message {
      margin-bottom: 25px;
      color: #555;
      font-size: 16px;
    }
    .cart-items {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      margin: 25px 0;
    }
    .cart-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .cart-item:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 500;
      color: #333;
    }
    .item-price {
      color: #666;
    }
    .cart-total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #135bec;
      display: flex;
      justify-content: space-between;
      font-size: 20px;
      font-weight: 700;
      color: #135bec;
    }
    ${
      discountText
        ? `
    .discount-banner {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      padding: 20px;
      border-radius: 6px;
      margin: 25px 0;
      text-align: center;
    }
    .discount-banner h2 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .discount-code {
      background-color: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 4px;
      display: inline-block;
      font-family: monospace;
      font-size: 18px;
      font-weight: 700;
      margin-top: 10px;
    }
    `
        : ''
    }
    .cta-button {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #135bec 0%, #0d47a1 100%);
      color: white;
      text-align: center;
      padding: 16px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(19, 91, 236, 0.3);
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
      margin-top: 30px;
    }
    .expiration {
      text-align: center;
      color: #f44336;
      font-weight: 600;
      margin-top: 15px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🛒 Tu Carrito Te Espera</h1>
    </div>
    <div class="content">
      <div class="greeting">Hola ${data.toName},</div>
      
      <div class="message">
        Notamos que dejaste algunos productos en tu carrito. ¡No te preocupes! 
        Los hemos guardado para ti.
      </div>

      <div class="cart-items">
        <h3 style="margin-top: 0; color: #333;">Productos en tu carrito:</h3>
        ${data.cartItems
          .map(
            (item) => `
          <div class="cart-item">
            <span class="item-name">${item.name} (x${item.quantity})</span>
            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `,
          )
          .join('')}
        <div class="cart-total">
          <span>Total:</span>
          <span>$${data.cartTotal.toFixed(2)}</span>
        </div>
      </div>

      ${
        discountText
          ? `
      <div class="discount-banner">
        <h2>🎉 ${discountText}</h2>
        ${
          data.discountCode
            ? `
          <div>Usa el código:</div>
          <div class="discount-code">${data.discountCode}</div>
        `
            : ''
        }
      </div>
      `
          : ''
      }

      ${
        data.recoveryLink
          ? `
      <a href="${data.recoveryLink}" class="cta-button">
        Completar Mi Compra Ahora
      </a>
      `
          : ''
      }

      ${
        data.expirationHours
          ? `
      <div class="expiration">⏰ ${expirationText}</div>
      `
          : ''
      }

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #999;">
        Si tienes alguna pregunta, no dudes en contactarnos. Estamos aquí para ayudarte.
      </div>
    </div>
    
    <div class="footer">
      <p>Este es un email automático de recuperación de carrito.</p>
      <p>Si no realizaste esta acción, puedes ignorar este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
Hola ${data.toName},

Notamos que dejaste algunos productos en tu carrito. ¡No te preocupes! Los hemos guardado para ti.

Productos en tu carrito:
${data.cartItems.map((item) => `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Total: $${data.cartTotal.toFixed(2)}

${discountText ? `\n🎉 ${discountText}${data.discountCode ? `\nUsa el código: ${data.discountCode}` : ''}\n` : ''}

${data.recoveryLink ? `Completa tu compra: ${data.recoveryLink}` : ''}

${data.expirationHours ? `\n⏰ ${expirationText}` : ''}

Si tienes alguna pregunta, no dudes en contactarnos.
    `.trim();

    return {
      html,
      text,
      subject: data.subject,
    };
  }

  /**
   * Obtiene el texto del descuento formateado
   */
  private getDiscountText(data: EmailPreviewData): string {
    if (data.discountPercent) {
      return `¡${data.discountPercent}% de Descuento!`;
    }
    if (data.discountAmount) {
      return `¡$${data.discountAmount.toFixed(2)} de Descuento!`;
    }
    if (data.discountCode && data.discountCode.toLowerCase().includes('envio')) {
      return '¡Envío Gratis!';
    }
    return '';
  }
}
