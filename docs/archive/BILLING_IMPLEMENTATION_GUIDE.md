# 💳 Guía de Implementación - Captura de Leads, Seguimiento y Facturación

## ✅ Lo que se ha implementado

### 1. Captura de Leads Mejorada

**Archivos creados:**
- `backend/src/marketing/lead-capture.service.ts` - Servicio completo de captura
- `backend/src/marketing/email.service.ts` - Servicio de emails (preparado para SendGrid)
- `backend/src/billing/billing.service.ts` - Servicio de Stripe
- `backend/src/billing/stripe-webhook.controller.ts` - Webhooks de Stripe

**Funcionalidades:**
- ✅ Captura de leads con email y nombre
- ✅ Creación automática de tenant y API key
- ✅ Trial de 14 días
- ✅ Tracking de estado (trial, active, churned)
- ✅ Prevención de duplicados

---

## 🔧 Configuración Necesaria

### 1. Variables de Entorno

Agregar a `backend/.env`:

```bash
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@agentslab.ai

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx

# Frontend URL (para redirects)
FRONTEND_URL=http://localhost:4200
```

### 2. Configurar SendGrid

1. Crear cuenta en [SendGrid](https://sendgrid.com)
2. Obtener API Key
3. Verificar dominio remitente
4. Agregar `SENDGRID_API_KEY` al `.env`

### 3. Configurar Stripe

1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener API keys (test mode para desarrollo)
3. Crear productos y precios:
   - Starter: €29/mes
   - Pro: €99/mes
   - Enterprise: €299/mes
4. Configurar webhook endpoint: `https://tu-dominio.com/webhooks/stripe`
5. Agregar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` al `.env`

---

## 📧 Implementar Envío de Emails

### Opción 1: SendGrid (Recomendado)

**Actualizar `email.service.ts`:**

```typescript
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }
  
  async sendWelcomeEmail(data: {
    to: string;
    name: string;
    apiKey: string;
    trialDays: number;
  }): Promise<{ success: boolean }> {
    const msg = {
      to: data.to,
      from: this.fromEmail,
      subject: 'Bienvenido a AI Agents Lab',
      html: `
        <h1>¡Hola ${data.name}!</h1>
        <p>Tu API Key es: <code>${data.apiKey}</code></p>
        <p>Tienes ${data.trialDays} días de trial gratis.</p>
        <a href="https://agentslab.ai/dashboard">Ir al Dashboard</a>
      `,
    };
    
    await sgMail.send(msg);
    return { success: true };
  }
}
```

---

## 🔄 Seguimientos Automáticos

### Implementar Cron Jobs

**Instalar:**
```bash
npm install @nestjs/schedule
```

**En `app.module.ts`:**
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ...
  ],
})
```

**Crear `follow-up-scheduler.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadCaptureService } from '../marketing/lead-capture.service';
import { EmailService } from '../marketing/email.service';

@Injectable()
export class FollowUpSchedulerService {
  constructor(
    private readonly leadService: LeadCaptureService,
    private readonly emailService: EmailService,
  ) {}
  
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processDailyFollowUps() {
    const leads = this.leadService.getLeadsNeedingFollowUp();
    
    for (const lead of leads) {
      const daysSince = this.getDaysSince(lead.trialStartedAt);
      
      if (daysSince === 3) {
        await this.emailService.sendFollowUp({
          to: lead.email,
          name: lead.name,
          type: 'day3',
        });
      } else if (daysSince === 7) {
        await this.emailService.sendFollowUp({
          to: lead.email,
          name: lead.name,
          type: 'day7',
        });
      } else if (daysSince === 10) {
        await this.emailService.sendFollowUp({
          to: lead.email,
          name: lead.name,
          type: 'day10',
          trialDaysRemaining: 4,
        });
      } else if (daysSince === 14) {
        await this.emailService.sendFollowUp({
          to: lead.email,
          name: lead.name,
          type: 'day14',
        });
        
        // Si no se convierte, marcar como churned
        if (!lead.convertedAt) {
          // await this.leadService.markAsChurned(lead.id);
        }
      }
    }
  }
}
```

---

## 💳 Flujo de Facturación

### 1. Crear Checkout Session

**Endpoint:** `POST /billing/create-checkout`

```typescript
@Post('create-checkout')
async createCheckout(@Body() body: { tenantId: string; plan: string }) {
  const tenant = await this.tenantService.findById(body.tenantId);
  
  const session = await this.billingService.createCheckoutSession({
    tenantId: body.tenantId,
    email: tenant.email,
    plan: body.plan,
  });
  
  return { checkoutUrl: session.url };
}
```

### 2. Frontend - Redirigir a Stripe

```typescript
// Cuando usuario click "Elegir Plan"
async selectPlan(plan: string) {
  const response = await this.http.post('/billing/create-checkout', {
    tenantId: this.tenantId,
    plan,
  }).toPromise();
  
  // Redirigir a Stripe Checkout
  window.location.href = response.checkoutUrl;
}
```

### 3. Webhook de Stripe

**Cuando se completa el pago:**
1. Stripe envía webhook a `/webhooks/stripe`
2. Backend actualiza tenant a `active`
3. Backend marca lead como `converted`
4. Backend guarda subscription ID

---

## 📊 Base de Datos (Próximo Paso)

### Tablas Necesarias

```sql
-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  agent_id VARCHAR(50),
  source VARCHAR(50) DEFAULT 'demo',
  status VARCHAR(50) DEFAULT 'trial',
  api_key_id UUID,
  tenant_id UUID,
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  converted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Próximos Pasos

### Esta Semana

1. ✅ Servicios creados (HECHO)
2. ⏳ Configurar SendGrid
3. ⏳ Implementar envío de emails real
4. ⏳ Crear templates de emails

### Próxima Semana

5. ⏳ Implementar cron jobs para seguimientos
6. ⏳ Crear base de datos (PostgreSQL)
7. ⏳ Migrar de in-memory a DB
8. ⏳ Configurar Stripe (test mode)

### Semana 3

9. ⏳ Frontend: Página de pricing
10. ⏳ Frontend: Integración con checkout
11. ⏳ Webhooks de Stripe funcionando
12. ⏳ Testing completo

---

## 🧪 Testing

### Test de Captura

```bash
curl -X POST http://localhost:3000/api/v1/marketing/capture-lead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "agentId": "booking"
  }'
```

### Test de Checkout

```bash
curl -X POST http://localhost:3000/api/v1/billing/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_123",
    "plan": "starter"
  }'
```

---

## 📝 Resumen

**Implementado:**
- ✅ Servicio de captura de leads
- ✅ Servicio de emails (estructura)
- ✅ Servicio de billing con Stripe
- ✅ Webhooks de Stripe

**Pendiente:**
- ⏳ Configurar SendGrid
- ⏳ Implementar envío real de emails
- ⏳ Cron jobs para seguimientos
- ⏳ Base de datos
- ⏳ Frontend de pricing

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Estructura lista, configuración pendiente











