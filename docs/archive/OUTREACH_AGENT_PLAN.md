# 🤖 Outreach Agent - Plan de Implementación

## 💡 Tu Idea

**Agente de Outreach/Lead Generation que:**
1. Hace scraping de negocios (Google Maps, directorios, etc.)
2. Envía emails personalizados
3. Hace seguimiento automático
4. Contacta por redes sociales (LinkedIn, Twitter, etc.)
5. **Para tu uso: GRATIS**
6. **Email también GRATIS**

---

## ✅ Mi Opinión: EXCELENTE IDEA

### Ventajas

1. **Dogfooding** - Usas tu propio producto
2. **Validación real** - Pruebas con casos reales
3. **Marketing** - "Lo usamos nosotros mismos"
4. **Revenue adicional** - Otros pagan, tú gratis
5. **Datos valiosos** - Aprendes qué funciona

### Consideraciones Importantes

⚠️ **Aspectos Legales/Éticos:**
- **GDPR/Privacy** - Scraping debe ser ético
- **Anti-spam** - Emails deben cumplir CAN-SPAM
- **Rate limiting** - No saturar APIs
- **Opt-out** - Permitir desuscripción
- **Transparencia** - Identificarse claramente

---

## 🎯 Arquitectura del Agente

### Componentes

```
┌─────────────────────────────────────────┐
│  OUTREACH AGENT                         │
├─────────────────────────────────────────┤
│  1. Scraping Module                     │
│     - Google Maps                       │
│     - Directorios de negocios           │
│     - LinkedIn                          │
│                                         │
│  2. Data Enrichment                     │
│     - Enriquecer con datos públicos     │
│     - Validar emails                    │
│                                         │
│  3. Email Module                        │
│     - Personalización con IA            │
│     - Envío masivo (SendGrid)           │
│     - Tracking (opens, clicks)           │
│                                         │
│  4. Social Media Module                 │
│     - LinkedIn messages                │
│     - Twitter DMs                       │
│     - Instagram DMs                     │
│                                         │
│  5. Follow-up Scheduler                 │
│     - Seguimientos automáticos          │
│     - A/B testing                      │
│                                         │
│  6. Analytics & Reporting               │
│     - Tasa de respuesta                 │
│     - Conversiones                      │
└─────────────────────────────────────────┘
```

---

## 🏗️ Estructura del Agente

### Domain Layer

```typescript
// entities/prospect.entity.ts
export class Prospect {
  id: string;
  businessName: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  linkedInUrl?: string;
  twitterHandle?: string;
  status: 'new' | 'contacted' | 'responded' | 'converted' | 'unsubscribed';
  contactedAt?: Date;
  lastFollowUpAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// entities/campaign.entity.ts
export class Campaign {
  id: string;
  name: string;
  description: string;
  targetIndustry?: string;
  targetLocation?: string;
  emailTemplate: string;
  socialTemplate?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalProspects: number;
  contacted: number;
  responded: number;
  converted: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Application Layer

```typescript
// services/scraping.service.ts
@Injectable()
export class ScrapingService {
  async scrapeGoogleMaps(query: string, location: string): Promise<Prospect[]>
  async scrapeDirectory(url: string): Promise<Prospect[]>
  async enrichProspect(prospect: Prospect): Promise<Prospect>
}

// services/email-outreach.service.ts
@Injectable()
export class EmailOutreachService {
  async sendPersonalizedEmail(prospect: Prospect, template: string): Promise<void>
  async scheduleFollowUp(prospectId: string, days: number): Promise<void>
  async trackEmail(prospectId: string, event: 'sent' | 'opened' | 'clicked'): Promise<void>
}

// services/social-outreach.service.ts
@Injectable()
export class SocialOutreachService {
  async sendLinkedInMessage(prospectId: string, message: string): Promise<void>
  async sendTwitterDM(prospectId: string, message: string): Promise<void>
  async followOnSocial(prospectId: string, platform: string): Promise<void>
}
```

---

## 🔧 Implementación Técnica

### 1. Scraping Module

**Librerías:**
- `puppeteer` - Web scraping
- `cheerio` - HTML parsing
- `google-maps-scraper` - Google Maps específico

```typescript
// tools/scrape-businesses.tool.ts
export const scrapeBusinessesTool = new DynamicStructuredTool({
  name: 'scrape_businesses',
  description: 'Scrapes businesses from Google Maps or directories',
  schema: z.object({
    query: z.string().describe('Business type or industry'),
    location: z.string().describe('Location to search'),
    maxResults: z.number().optional().describe('Max number of results'),
  }),
  func: async ({ query, location, maxResults = 50 }) => {
    // Scrape Google Maps
    const businesses = await scrapingService.scrapeGoogleMaps(query, location);
    return JSON.stringify(businesses.slice(0, maxResults));
  },
});
```

### 2. Email Personalization

**Usar LangChain para personalizar:**

```typescript
// services/email-personalization.service.ts
async personalizeEmail(prospect: Prospect, baseTemplate: string): Promise<string> {
  const prompt = `
    Personaliza este email para ${prospect.businessName}:
    
    Template: ${baseTemplate}
    
    Información del negocio:
    - Nombre: ${prospect.businessName}
    - Industria: ${prospect.industry}
    - Ubicación: ${prospect.address}
    
    Crea un email personalizado, profesional y que no parezca spam.
  `;
  
  const response = await this.aiProvider.generateText(prompt);
  return response;
}
```

### 3. Social Media Integration

**LinkedIn:**
- Usar LinkedIn API (oficial) o `linkedin-scraper`
- ⚠️ LinkedIn tiene límites estrictos

**Twitter:**
- Twitter API v2
- Rate limits: 1,500 DMs/día

**Instagram:**
- Instagram Basic Display API
- ⚠️ Muy limitado, mejor usar WhatsApp Business API

---

## 💰 Modelo de Precios

### Para Ti (Gratis)

```typescript
// En tenant.entity.ts
export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  INTERNAL = 'internal', // ← NUEVO: Para tu uso
}

// En billing.service.ts
if (tenant.plan === 'internal') {
  // Sin límites
  // Sin facturación
  // Acceso completo
}
```

### Para Clientes (Pago)

**Planes:**
- **Starter:** €99/mes - 500 prospects/mes
- **Pro:** €299/mes - 2,000 prospects/mes
- **Enterprise:** €999/mes - Ilimitado

---

## 📋 Plan de Implementación

### Fase 1: MVP (Semana 1-2)

**Funcionalidades básicas:**
- [ ] Scraping de Google Maps
- [ ] Envío de emails (SendGrid)
- [ ] Personalización básica con IA
- [ ] Seguimiento automático (1 follow-up)

**Stack:**
- Backend: NestJS
- Scraping: Puppeteer
- Email: SendGrid
- IA: LangChain (personalización)

### Fase 2: Social Media (Semana 3)

- [ ] LinkedIn integration
- [ ] Twitter DMs
- [ ] Dashboard de campañas

### Fase 3: Avanzado (Semana 4)

- [ ] A/B testing de emails
- [ ] Analytics avanzado
- [ ] CRM integration
- [ ] Multi-canal (email + social)

---

## ⚠️ Consideraciones Legales

### 1. GDPR Compliance

- ✅ Consentimiento explícito (opt-in)
- ✅ Derecho al olvido (opt-out)
- ✅ Datos mínimos necesarios
- ✅ Transparencia en uso de datos

### 2. Anti-Spam

- ✅ CAN-SPAM compliance
- ✅ Unsubscribe link obligatorio
- ✅ Identificación clara del remitente
- ✅ No comprar listas de emails

### 3. Rate Limiting

- ✅ Respetar límites de APIs
- ✅ No saturar servidores
- ✅ Delays entre requests
- ✅ Retry logic con backoff

---

## 🚀 Implementación Inmediata

### Estructura de Archivos

```
backend/src/agents/outreach-agent/
├── domain/
│   ├── entities/
│   │   ├── prospect.entity.ts
│   │   └── campaign.entity.ts
│   └── interfaces/
│       └── scraping-repository.interface.ts
├── application/
│   ├── services/
│   │   ├── scraping.service.ts
│   │   ├── email-outreach.service.ts
│   │   ├── social-outreach.service.ts
│   │   └── email-personalization.service.ts
│   └── tools/
│       ├── scrape-businesses.tool.ts
│       ├── send-email.tool.ts
│       └── send-social-message.tool.ts
├── infrastructure/
│   ├── scrapers/
│   │   ├── google-maps.scraper.ts
│   │   └── directory.scraper.ts
│   └── repositories/
│       └── in-memory-prospect.repository.ts
└── presentation/
    └── outreach-agent.controller.ts
```

---

## 🎯 Casos de Uso

### Caso 1: Scraping + Email

```
Usuario: "Encuentra 50 clínicas dentales en Madrid y envíales email"
→ Agente scrapea Google Maps
→ Encuentra 50 clínicas
→ Personaliza emails con IA
→ Envía en lotes (10/hora para evitar spam)
→ Programa seguimientos
```

### Caso 2: Multi-canal

```
Usuario: "Contacta a 20 agencias de marketing en Barcelona"
→ Scrapea negocios
→ Envía email
→ Si no responde en 3 días → LinkedIn message
→ Si no responde en 7 días → Twitter DM
```

### Caso 3: Seguimiento Automático

```
Usuario: "Haz seguimiento a los que abrieron el email pero no respondieron"
→ Detecta opens sin clicks
→ Envía follow-up personalizado
→ "Vi que abriste el email, ¿te interesa?"
```

---

## 📊 Métricas a Trackear

- **Scraping:** Número de prospects encontrados
- **Email:** Sent, Opened, Clicked, Bounced
- **Social:** Messages sent, Responses
- **Conversión:** Responded, Converted
- **ROI:** Cost per lead, Cost per conversion

---

## ✅ Conclusión

**Es una EXCELENTE idea porque:**
1. ✅ Te ayuda a generar leads para tu negocio
2. ✅ Validas tu producto con uso real
3. ✅ Puedes venderlo a otros
4. ✅ Aprendes qué funciona

**Recomendaciones:**
1. ⚠️ Cumple con GDPR y anti-spam
2. ⚠️ Empieza con email (más seguro legalmente)
3. ⚠️ Social media después (más complejo)
4. ✅ Personalización con IA es clave
5. ✅ Tracking y analytics desde el inicio

---

**¿Quieres que empiece a implementarlo ahora?**

---

**Última actualización:** 2024-12-10
