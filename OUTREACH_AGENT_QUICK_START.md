# 🚀 Outreach Agent - Quick Start

## 🎯 Resumen Ejecutivo

**Agente de Outreach/Lead Generation que:**
- Scrapea negocios (Google Maps, directorios)
- Envía emails personalizados con IA
- Hace seguimiento automático
- Contacta por redes sociales
- **Para ti: GRATIS** (plan `internal`)
- **Email: GRATIS** (usando SendGrid free tier o tu cuenta)

---

## ⚡ Implementación Rápida (Esta Semana)

### Paso 1: Estructura Básica (2 horas)

```bash
# Crear estructura
mkdir -p backend/src/agents/outreach-agent/{domain/entities,application/{services,tools},infrastructure/{scrapers,repositories},presentation}
```

### Paso 2: Entities (30 min)

```typescript
// prospect.entity.ts
export class Prospect {
  id: string;
  businessName: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  status: 'new' | 'contacted' | 'responded' | 'converted';
  createdAt: Date;
}
```

### Paso 3: Scraping Service (2 horas)

```typescript
// scraping.service.ts
import * as puppeteer from 'puppeteer';

async scrapeGoogleMaps(query: string, location: string): Promise<Prospect[]> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navegar a Google Maps
  await page.goto(`https://www.google.com/maps/search/${query}+${location}`);
  
  // Extraer datos
  const businesses = await page.evaluate(() => {
    // Scraping logic
  });
  
  return businesses;
}
```

### Paso 4: Email Service (1 hora)

```typescript
// email-outreach.service.ts
async sendPersonalizedEmail(prospect: Prospect, template: string) {
  // Personalizar con IA
  const personalized = await this.aiService.personalize(template, prospect);
  
  // Enviar con SendGrid
  await this.sendGrid.send({
    to: prospect.email,
    subject: `Hola ${prospect.businessName}`,
    html: personalized,
  });
}
```

### Paso 5: LangChain Agent (2 horas)

```typescript
// outreach-agent-chain.service.ts
const tools = [
  scrapeBusinessesTool,
  sendEmailTool,
  scheduleFollowUpTool,
];

const agent = createReactAgent({
  llm: chatModel,
  tools,
  systemPrompt: `Eres un agente de outreach...`,
});
```

---

## 📦 Dependencias

```bash
cd backend
npm install puppeteer cheerio @sendgrid/mail
npm install --save-dev @types/puppeteer
```

---

## 🔧 Configuración

### .env

```bash
# SendGrid (para emails gratis)
SENDGRID_API_KEY=SG.xxxxx

# LinkedIn (opcional, para social)
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx

# Twitter (opcional)
TWITTER_API_KEY=xxxxx
TWITTER_API_SECRET=xxxxx
```

---

## 🎨 Ejemplo de Uso

### Comando 1: Scraping

```typescript
POST /api/v1/agents/outreach/execute
{
  "message": "Encuentra 20 clínicas dentales en Madrid",
  "campaignId": "campaign_123"
}
```

**Respuesta:**
```json
{
  "prospects": [
    {
      "businessName": "Clínica Dental XYZ",
      "email": "info@xyz.com",
      "phone": "+34 123 456 789",
      "address": "Calle Mayor 1, Madrid"
    }
  ],
  "total": 20
}
```

### Comando 2: Enviar Emails

```typescript
POST /api/v1/agents/outreach/execute
{
  "message": "Envía emails a los prospects de la campaña campaign_123",
  "campaignId": "campaign_123",
  "emailTemplate": "Hola {{businessName}}, ..."
}
```

**Respuesta:**
```json
{
  "emailsSent": 20,
  "personalized": true,
  "scheduledFollowUps": 20
}
```

---

## ⚠️ Limitaciones Legales

### Email

- ✅ **CAN-SPAM:** Incluir unsubscribe
- ✅ **GDPR:** Opt-in explícito
- ✅ **Rate limiting:** Máx 100 emails/hora

### Scraping

- ✅ **Robots.txt:** Respetar
- ✅ **Rate limiting:** Delays entre requests
- ✅ **Términos de servicio:** Revisar

### Social Media

- ✅ **API limits:** Respetar rate limits
- ✅ **Spam:** No enviar mensajes masivos
- ✅ **Opt-out:** Permitir desuscripción

---

## 🚀 Próximos Pasos

### Esta Semana

1. ✅ Crear estructura básica
2. ✅ Implementar scraping de Google Maps
3. ✅ Implementar envío de emails
4. ✅ Personalización con IA

### Próxima Semana

5. ⏳ LinkedIn integration
6. ⏳ Twitter DMs
7. ⏳ Dashboard de campañas
8. ⏳ Analytics

---

## 💡 Tips

1. **Empieza pequeño:** 10-20 prospects para probar
2. **Personaliza mucho:** IA hace la diferencia
3. **Trackea todo:** Opens, clicks, responses
4. **A/B testing:** Prueba diferentes templates
5. **Seguimiento:** 3-5 follow-ups máximo

---

**¿Quieres que empiece a implementarlo ahora?**

---

**Última actualización:** 2024-12-10



