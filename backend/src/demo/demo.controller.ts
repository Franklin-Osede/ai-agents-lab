import { Controller, Post, Body, HttpCode, HttpStatus, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { BookingAgentChainService } from '../agents/booking-agent/application/services/booking-agent-chain.service';

/**
 * Demo Controller
 * 
 * Public endpoints for trying agents without API key
 * Limited to 10 requests per IP/session
 */
@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);
  
  // Simple rate limiting by IP (in production, use Redis)
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly MAX_REQUESTS = 10;
  private readonly RESET_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  constructor(
    private readonly bookingChainService: BookingAgentChainService,
  ) {}
  
  /**
   * Check rate limit for IP
   */
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(ip);
    
    if (!record || now > record.resetAt) {
      // Reset or create new record
      this.requestCounts.set(ip, {
        count: 1,
        resetAt: now + this.RESET_INTERVAL,
      });
      return true;
    }
    
    if (record.count >= this.MAX_REQUESTS) {
      return false;
    }
    
    record.count++;
    this.requestCounts.set(ip, record);
    return true;
  }
  
  @Post('booking/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Try Booking Agent (no API key required, 10 requests max)' })
  async demoBookingChat(
    @Body() body: { message: string; sessionId?: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Check rate limit
    if (!this.checkRateLimit(ip)) {
      return {
        response: 'Has alcanzado el límite de 10 interacciones. Regístrate para obtener acceso ilimitado.',
        limitReached: true,
        upgradeUrl: 'https://agentslab.ai/signup',
      };
    }
    
    try {
      const sessionId = body.sessionId || `demo_${ip}_${Date.now()}`;
      
      // Extract service context from request if provided
      const serviceContext = (body as any).serviceContext;
      // Map service ID to business type
      const serviceId = serviceContext?.id || serviceContext?.businessType;
      const businessType = this.mapServiceToBusinessType(serviceId);
      
      const response = await this.bookingChainService.processRequest(body.message, {
        businessId: 'demo-business',
        customerId: sessionId,
        businessType, // Pass business type for personalized prompt
        serviceContext, // Pass full context
      });
      
      // Parse response to extract tool calls
      let parsedResponse: any = { response };
      
      try {
        // Try to parse as JSON (for enhanced responses with tool calls)
        const jsonResponse = JSON.parse(response);
        parsedResponse = jsonResponse;
      } catch {
        // If not JSON, it's a simple string response
        parsedResponse = { response };
      }
      
      return {
        ...parsedResponse,
        limitReached: false,
        remainingRequests: this.MAX_REQUESTS - (this.requestCounts.get(ip)?.count || 0),
      };
    } catch (error) {
      this.logger.error('Demo booking error:', error);
      return {
        response: 'Lo siento, hubo un error procesando tu solicitud. Por favor, intenta de nuevo.',
        error: true,
      };
    }
  }
  
  /**
   * Map service ID to business type for context
   */
  private mapServiceToBusinessType(serviceId?: string): string {
    if (!serviceId) return 'salud'; // Default
    
    const serviceIdLower = serviceId.toLowerCase();
    
    // Map all services to their business types
    const mapping: Record<string, string> = {
      // Salud y Bienestar
      'clinica': 'salud',
      'dentista': 'dentista',
      'fisioterapia': 'salud',
      'veterinaria': 'salud',
      // Belleza y Estética
      'peluqueria': 'belleza',
      'estetica': 'belleza',
      'spa': 'belleza',
      'unas': 'belleza',
      // Restaurantes y Eventos
      'restaurante': 'restaurante',
      'catering': 'restaurante',
      'eventos': 'restaurante',
      // Servicios Profesionales
      'abogado': 'profesional',
      'contador': 'profesional',
      'consultor': 'profesional',
      'coach': 'profesional',
      // Otros Negocios
      'fontanero': 'servicio',
      'electricista': 'servicio',
      'fitness': 'fitness',
      'educacion': 'educacion',
      'reparaciones': 'servicio',
      // Fallbacks
      'salud': 'salud',
      'belleza': 'belleza',
    };
    
    // Try exact match first
    if (mapping[serviceIdLower]) {
      return mapping[serviceIdLower];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(mapping)) {
      if (serviceIdLower.includes(key) || key.includes(serviceIdLower)) {
        return value;
      }
    }
    
    return 'salud'; // Default
  }
}



