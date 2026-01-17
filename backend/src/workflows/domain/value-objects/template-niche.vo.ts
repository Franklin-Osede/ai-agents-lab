export type NicheType = 'health' | 'restaurant' | 'services' | 'ecommerce';

export interface TemplateIntentData {
  name: string;
  displayName: string;
  examples: string[];
  icon: string;
}

export class TemplateNiche {
  private constructor(
    public readonly type: NicheType,
    public readonly subtype?: string,
  ) {}

  static create(type: NicheType, subtype?: string): TemplateNiche {
    const validTypes: NicheType[] = ['health', 'restaurant', 'services', 'ecommerce'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid niche type: ${type}`);
    }
    return new TemplateNiche(type, subtype);
  }

  getDefaultIntents(): TemplateIntentData[] {
    const intentsByNiche: Record<NicheType, TemplateIntentData[]> = {
      health: [
        {
          name: 'schedule_appointment',
          displayName: 'Agendar cita',
          examples: ['quiero agendar', 'necesito cita', 'reservar consulta'],
          icon: '📅',
        },
        {
          name: 'pain_consultation',
          displayName: 'Consulta de dolor',
          examples: ['me duele', 'tengo dolor', 'siento molestia'],
          icon: '🩺',
        },
        {
          name: 'pricing_inquiry',
          displayName: 'Precios',
          examples: ['cuánto cuesta', 'precios', 'tarifas'],
          icon: '💰',
        },
        {
          name: 'emergency',
          displayName: 'Urgencia',
          examples: ['urgente', 'emergencia', 'es grave'],
          icon: '🚨',
        },
        {
          name: 'services_info',
          displayName: 'Información de servicios',
          examples: ['qué servicios', 'tratamientos', 'especialidades'],
          icon: 'ℹ️',
        },
      ],
      restaurant: [
        {
          name: 'make_reservation',
          displayName: 'Reservar mesa',
          examples: ['reservar mesa', 'quiero reservar', 'hacer reserva'],
          icon: '🪑',
        },
        {
          name: 'order_delivery',
          displayName: 'Pedir delivery',
          examples: ['pedir comida', 'delivery', 'a domicilio'],
          icon: '🛵',
        },
        {
          name: 'menu_inquiry',
          displayName: 'Ver menú',
          examples: ['ver menú', 'qué tienen', 'carta'],
          icon: '📋',
        },
        {
          name: 'allergies',
          displayName: 'Alergias',
          examples: ['alérgico', 'sin gluten', 'restricciones'],
          icon: '⚠️',
        },
      ],
      services: [
        {
          name: 'request_quote',
          displayName: 'Solicitar presupuesto',
          examples: ['presupuesto', 'cotización', 'cuánto cuesta'],
          icon: '💼',
        },
        {
          name: 'schedule_consultation',
          displayName: 'Agendar consulta',
          examples: ['consulta', 'reunión', 'agendar'],
          icon: '📅',
        },
        {
          name: 'service_inquiry',
          displayName: 'Información de servicios',
          examples: ['servicios', 'qué hacen', 'especialidades'],
          icon: 'ℹ️',
        },
      ],
      ecommerce: [
        {
          name: 'product_search',
          displayName: 'Buscar producto',
          examples: ['buscar', 'quiero comprar', 'necesito'],
          icon: '🔍',
        },
        {
          name: 'order_tracking',
          displayName: 'Seguimiento de pedido',
          examples: ['dónde está mi pedido', 'rastrear', 'seguimiento'],
          icon: '📦',
        },
        {
          name: 'returns',
          displayName: 'Devoluciones',
          examples: ['devolver', 'cambio', 'reembolso'],
          icon: '↩️',
        },
      ],
    };

    return intentsByNiche[this.type] || [];
  }

  equals(other: TemplateNiche): boolean {
    return this.type === other.type && this.subtype === other.subtype;
  }
}
