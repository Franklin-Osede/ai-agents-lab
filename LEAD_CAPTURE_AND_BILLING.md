# 💰 Sistema de Captura de Leads, Seguimiento y Facturación

## 🎯 Objetivo

1. **Capturar leads** del demo
2. **Hacer seguimiento** automático (emails, recordatorios)
3. **Cobrar** cuando se convierten en clientes

---

## 📊 Flujo Completo

```
Demo → Lead Capturado → Seguimiento → Conversión → Facturación
```

### Paso a Paso

1. **Usuario prueba demo** (3-5 interacciones)
2. **Modal de captura** aparece
3. **Lead capturado** → Guardado en base de datos
4. **Email automático** con API key (trial 14 días)
5. **Seguimiento automático:**
   - Día 1: Email de bienvenida
   - Día 3: Tips de uso
   - Día 7: Casos de éxito
   - Día 10: Recordatorio de trial
   - Día 14: "Tu trial termina, ¿quieres continuar?"
6. **Si se convierte:**
   - Stripe Checkout
   - Suscripción activada
   - Facturación automática

---

## 🗄️ Base de Datos

### Tabla: Leads

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  agent_id VARCHAR(50), -- Qué agente probó
  source VARCHAR(50) DEFAULT 'demo', -- 'demo', 'website', etc.
  status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'churned'
  api_key_id UUID REFERENCES api_keys(id),
  tenant_id UUID REFERENCES tenants(id),
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  converted_at TIMESTAMP, -- Cuando se convierte en cliente pagando
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tabla: Lead Activities (Seguimiento)

```sql
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  activity_type VARCHAR(50), -- 'email_sent', 'email_opened', 'clicked', 'converted'
  activity_data JSONB, -- Datos adicionales
  created_at TIMESTAMP
);
```

### Tabla: Subscriptions (Facturación)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50), -- 'starter', 'pro', 'enterprise'
  status VARCHAR(50), -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔧 Implementación

### 1. Backend - Lead Capture Mejorado

**Archivo:** `backend/src/marketing/lead-capture.service.ts`

```typescript
@Injectable()
export class LeadCaptureService {
  async captureLead(data: {
    email: string;
    name: string;
    agentId?: string;
    source?: string;
  }): Promise<{
    success: boolean;
    apiKey?: string;
    tenantId: string;
    trialEndsAt: Date;
  }> {
    // 1. Verificar si lead ya existe
    let lead = await this.leadRepository.findByEmail(data.email);
    
    if (lead && lead.status === 'active') {
      // Lead ya existe y está activo
      return {
        success: true,
        tenantId: lead.tenantId,
      };
    }
    
    // 2. Crear tenant
    const tenant = this.tenantService.createTenant({
      name: data.name,
      email: data.email,
      status: 'trial',
      plan: 'free',
    });
    
    // 3. Generar API key
    const { apiKey } = await this.apiKeyService.generateApiKey(
      tenant.id,
      ['*'], // Todos los scopes para trial
      100, // 100 requests/hora para trial
    );
    
    // 4. Crear lead
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días de trial
    
    lead = await this.leadRepository.create({
      email: data.email,
      name: data.name,
      agentId: data.agentId,
      source: data.source || 'demo',
      status: 'trial',
      apiKeyId: apiKey.id,
      tenantId: tenant.id,
      trialStart: new Date(),
      trialEnds: trialEndsAt,
    });
    
    // 5. Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail({
      to: data.email,
      name: data.name,
      apiKey,
      trialDays: 14,
    });
    
    // 6. Programar seguimientos
    await this.scheduleFollowUps(lead.id);
    
    return {
      success: true,
      apiKey, // Solo se muestra una vez
      tenantId: tenant.id,
      trialEndsAt,
    };
  }
}
```

### 2. Backend - Email Service

**Archivo:** `backend/src/marketing/email.service.ts`

```typescript
@Injectable()
export class EmailService {
  constructor(
    private readonly sendGridService: any, // O Mailchimp, etc.
  ) {}
  
  async sendWelcomeEmail(data: {
    to: string;
    name: string;
    apiKey: string;
    trialDays: number;
  }): Promise<void> {
    const html = `
      <h1>¡Bienvenido ${data.name}!</h1>
      <p>Tu API Key es: <code>${data.apiKey}</code></p>
      <p>Tienes ${data.trialDays} días de trial gratis.</p>
      <a href="https://agentslab.ai/dashboard">Ir al Dashboard</a>
    `;
    
    await this.sendGridService.send({
      to: data.to,
      subject: 'Bienvenido a AI Agents Lab',
      html,
    });
  }
  
  async sendFollowUp(leadId: string, type: 'day3' | 'day7' | 'day10' | 'day14'): Promise<void> {
    const lead = await this.leadRepository.findById(leadId);
    
    const templates = {
      day3: {
        subject: 'Tips para usar tu agente',
        content: 'Aquí tienes algunos tips...',
      },
      day7: {
        subject: 'Casos de éxito',
        content: 'Mira cómo otros negocios usan nuestros agentes...',
      },
      day10: {
        subject: 'Tu trial termina pronto',
        content: 'Quedan 4 días de trial...',
      },
      day14: {
        subject: 'Último día de trial',
        content: 'Hoy termina tu trial. ¿Quieres continuar?',
      },
    };
    
    const template = templates[type];
    await this.sendGridService.send({
      to: lead.email,
      subject: template.subject,
      html: template.content,
    });
    
    // Registrar actividad
    await this.leadActivityService.create({
      leadId,
      activityType: 'email_sent',
      activityData: { type },
    });
  }
}
```

### 3. Backend - Seguimiento Automático

**Archivo:** `backend/src/marketing/follow-up-scheduler.service.ts`

```typescript
@Injectable()
export class FollowUpSchedulerService {
  // Usar cron jobs o queue system
  
  @Cron('0 9 * * *') // Cada día a las 9 AM
  async processDailyFollowUps() {
    // Encontrar leads que necesitan seguimiento
    const leads = await this.leadRepository.findLeadsNeedingFollowUp();
    
    for (const lead of leads) {
      const daysSinceTrialStart = this.getDaysSince(lead.trialStart);
      
      if (daysSinceTrialStart === 3) {
        await this.emailService.sendFollowUp(lead.id, 'day3');
      } else if (daysSinceTrialStart === 7) {
        await this.emailService.sendFollowUp(lead.id, 'day7');
      } else if (daysSinceTrialStart === 10) {
        await this.emailService.sendFollowUp(lead.id, 'day10');
      } else if (daysSinceTrialStart === 14) {
        await this.emailService.sendFollowUp(lead.id, 'day14');
        // Si no se convierte, marcar como churned
        if (!lead.convertedAt) {
          await this.leadRepository.update(lead.id, { status: 'churned' });
        }
      }
    }
  }
}
```

### 4. Backend - Facturación con Stripe

**Archivo:** `backend/src/billing/billing.service.ts`

```typescript
@Injectable()
export class BillingService {
  constructor(
    private readonly stripe: Stripe,
  ) {}
  
  /**
   * Crear checkout session cuando lead se convierte
   */
  async createCheckoutSession(tenantId: string, plan: string): Promise<string> {
    const tenant = await this.tenantService.findById(tenantId);
    
    const session = await this.stripe.checkout.sessions.create({
      customer_email: tenant.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `AI Agents Lab - ${plan}`,
          },
          unit_amount: this.getPlanPrice(plan) * 100, // En centavos
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `https://agentslab.ai/dashboard?success=true`,
      cancel_url: `https://agentslab.ai/dashboard?canceled=true`,
      metadata: {
        tenantId,
        plan,
      },
    });
    
    return session.url; // URL para redirigir al usuario
  }
  
  /**
   * Webhook de Stripe (cuando se completa pago)
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata.tenantId;
      
      // Actualizar tenant a activo
      await this.tenantService.update(tenantId, {
        status: 'active',
        plan: session.metadata.plan,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
      });
      
      // Actualizar lead a convertido
      const lead = await this.leadRepository.findByTenantId(tenantId);
      if (lead) {
        await this.leadRepository.update(lead.id, {
          status: 'active',
          convertedAt: new Date(),
        });
      }
    }
  }
  
  private getPlanPrice(plan: string): number {
    const prices = {
      starter: 29,
      pro: 99,
      enterprise: 299,
    };
    return prices[plan] || 29;
  }
}
```

---

## 📧 Integración Email Marketing

### Opción 1: SendGrid (Recomendado)

```bash
npm install @sendgrid/mail
```

```typescript
// backend/src/marketing/sendgrid.service.ts
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  
  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    await sgMail.send({
      to: data.to,
      from: 'noreply@agentslab.ai',
      subject: data.subject,
      html: data.html,
    });
  }
}
```

### Opción 2: Mailchimp

```bash
npm install @mailchimp/mailchimp_marketing
```

---

## 💳 Integración Stripe

### 1. Instalar Stripe

```bash
cd backend
npm install stripe @types/stripe
```

### 2. Configurar Stripe

```typescript
// backend/src/billing/stripe.service.ts
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  
  // Métodos de Stripe
}
```

### 3. Webhooks de Stripe

```typescript
// backend/src/billing/stripe-webhook.controller.ts
@Controller('webhooks/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const event = this.stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await this.billingService.handleStripeWebhook(event);
    res.json({ received: true });
  }
}
```

---

## 📋 Plan de Implementación

### Fase 1: Captura de Leads (Esta Semana)

- [x] Endpoint `/marketing/capture-lead`
- [ ] Base de datos para leads
- [ ] Email de bienvenida
- [ ] API key automática

### Fase 2: Seguimiento (Próxima Semana)

- [ ] Email service (SendGrid)
- [ ] Cron jobs para seguimientos
- [ ] Templates de emails
- [ ] Tracking de actividades

### Fase 3: Facturación (Semana 3)

- [ ] Stripe integration
- [ ] Checkout sessions
- [ ] Webhooks
- [ ] Suscripciones

---

## 🚀 Implementación Inmediata

¿Quieres que empiece a implementar ahora?

1. **Base de datos de leads** (tablas)
2. **Email service** (SendGrid)
3. **Seguimientos automáticos** (cron jobs)
4. **Stripe integration** (checkout + webhooks)

---

**Última actualización:** 2024-12-10







