# 🚀 Plan de Implementación SaaS - AI Agents Lab Platform

## 📋 Resumen Ejecutivo

Este documento describe el plan completo para convertir **todos los agentes AI** (Booking, Abandoned Cart, Webinar Recovery, Invoice Chaser, Voice Brand) en una **plataforma SaaS modular plug-and-play** que permita a diferentes negocios activar los agentes que necesiten, integrarlos en sus websites, y cobrar a sus clientes.

---

## 🎯 Objetivos del SaaS

1. **Plug-and-Play**: Integración en menos de 5 minutos
2. **Multi-tenant**: Soporte para múltiples negocios independientes
3. **White-label**: Personalizable con branding del cliente
4. **Monetización**: Sistema de pagos integrado para que negocios cobren a sus clientes
5. **Escalable**: Arquitectura que soporte miles de negocios simultáneamente

---

## 🏗️ Arquitectura SaaS

### 1. Multi-Tenancy

```
┌─────────────────────────────────────────────────────────┐
│              SaaS Platform (AI Agents Lab)               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Business 1  │  │  Business 2  │  │  Business N   ││
│  │  (Tenant)    │  │  (Tenant)    │  │  (Tenant)    ││
│  │              │  │              │  │              ││
│  │  - API Key   │  │  - API Key   │  │  - API Key   ││
│  │  - Config    │  │  - Config    │  │  - Config    ││
│  │  - Branding   │  │  - Branding   │  │  - Branding   ││
│  │  - Payments   │  │  - Payments   │  │  - Payments   ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Shared Agent Engine (Compartido)         │  │
│  │  - LangChain + OpenAI                            │  │
│  │  - Multi-tenant Infrastructure                  │  │
│  │  - Billing & Payments                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Booking  │  │  Cart    │  │ Webinar  │  │ Invoice  ││
│  │  Agent   │  │ Recovery │  │ Recovery │  │  Chaser  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                          │
│  ┌──────────┐                                            │
│  │  Voice   │  Cada negocio activa los que necesita     │
│  │  Agent   │                                            │
│  └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

### 2. Componentes Principales

#### A. **Backend Multi-Tenant**

**Nuevos Módulos Necesarios:**

1. **Tenant Management Module**
   - Gestión de negocios (tenants)
   - API Keys por tenant
   - Configuración por tenant
   - Límites y cuotas

2. **Billing & Payments Module**
   - Stripe/PayPal integration
   - Suscripciones (mensual/anual)
   - Facturación automática
   - Webhooks de pago

3. **White-Label Module**
   - Personalización de branding
   - Logos, colores, textos
   - Dominios personalizados

4. **Agent Registry Module**
   - Registro de agentes disponibles
   - Activación/desactivación por tenant
   - Configuración por agente

5. **Integration Module**
   - WordPress Plugin (unificado)
   - JavaScript Widget (por agente o unificado)
   - API REST
   - Webhooks

#### B. **Frontend Widgets (Plug-and-Play)**

**Opciones de Integración por Agente:**

1. **WordPress Plugin (Unificado)**
   ```php
   // Booking Agent
   [ai_agent api_key="sk_live_xxx" agent="booking"]
   
   // Abandoned Cart
   [ai_agent api_key="sk_live_xxx" agent="cart-recovery"]
   
   // Múltiples agentes
   [ai_agent api_key="sk_live_xxx" agents="booking,invoice-chaser"]
   ```

2. **JavaScript Widget (Por Agente)**
   ```html
   <!-- Booking Agent -->
   <div id="ai-booking-agent" 
        data-api-key="sk_live_xxx"
        data-agent="booking">
   </div>
   
   <!-- O Widget Unificado -->
   <div id="ai-agents-lab" 
        data-api-key="sk_live_xxx"
        data-agents="booking,cart-recovery,voice">
   </div>
   ```

3. **API REST Directa**
   ```javascript
   // Booking Agent
   fetch('https://api.agentslab.ai/v1/agents/booking/chat', {
     headers: {
       'Authorization': 'Bearer sk_live_xxx',
       'X-Tenant-ID': 'tenant_123'
     },
     body: JSON.stringify({ message: 'Quiero una cita' })
   })
   
   // Abandoned Cart
   fetch('https://api.agentslab.ai/v1/agents/cart-recovery/recover', {
     headers: {
       'Authorization': 'Bearer sk_live_xxx',
       'X-Tenant-ID': 'tenant_123'
     },
     body: JSON.stringify({ cartId: 'cart_456' })
   })
   ```

---

## 📦 Estructura de Base de Datos

### Tablas Principales

```sql
-- Tenants (Negocios)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  api_key VARCHAR(255) UNIQUE,
  status VARCHAR(50), -- active, suspended, trial
  plan VARCHAR(50), -- free, starter, pro, enterprise
  created_at TIMESTAMP,
  settings JSONB -- branding, config, etc.
);

-- Tenant Subscriptions
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP
);

-- Agent Activation (Qué agentes tiene cada tenant)
CREATE TABLE tenant_agents (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  agent_id VARCHAR(50), -- 'booking', 'cart-recovery', 'webinar-recovery', etc.
  status VARCHAR(50), -- 'active', 'inactive', 'trial'
  config JSONB, -- Configuración específica del agente
  activated_at TIMESTAMP,
  UNIQUE(tenant_id, agent_id)
);

-- Bookings (Multi-tenant)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  agent_id VARCHAR(50) DEFAULT 'booking', -- Para tracking
  customer_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  service_type VARCHAR(255),
  appointment_date TIMESTAMP,
  status VARCHAR(50),
  payment_status VARCHAR(50),
  amount DECIMAL(10,2),
  created_at TIMESTAMP
);

-- Usage Tracking (Para billing por agente)
CREATE TABLE agent_usage (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  agent_id VARCHAR(50),
  action_type VARCHAR(50), -- 'booking', 'message', 'voice_generated', 'cart_recovered'
  count INTEGER DEFAULT 1,
  date DATE,
  created_at TIMESTAMP,
  UNIQUE(tenant_id, agent_id, action_type, date)
);

-- Tenant Payments (Para que cobren a sus clientes)
CREATE TABLE tenant_payments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  booking_id UUID REFERENCES bookings(id),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## 🔧 Implementación Técnica

### Fase 1: Backend Multi-Tenant (Semanas 1-4)

#### Semana 1-2: Tenant Management

**Tareas:**
- [ ] Crear módulo `tenant-management`
- [ ] Implementar middleware de autenticación por API Key
- [ ] Sistema de generación de API Keys
- [ ] Endpoints de gestión de tenants
- [ ] Middleware para inyectar `tenant_id` en requests

**Código Ejemplo:**

```typescript
// backend/src/core/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      throw new UnauthorizedException('API Key required');
    }
    
    const tenant = await this.tenantService.findByApiKey(apiKey);
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid or inactive API Key');
    }
    
    req['tenant'] = tenant;
    next();
  }
}
```

#### Semana 3: Billing Integration

**Tareas:**
- [ ] Integrar Stripe
- [ ] Crear planes de suscripción
- [ ] Webhooks de Stripe
- [ ] Gestión de suscripciones
- [ ] Límites por plan

**Planes Sugeridos:**

### Modelo Híbrido (Recomendado)

**Plan Base + Add-ons por Agente:**

| Agente | Precio/Mes | Límite Incluido |
|--------|-----------|----------------|
| **Booking Agent** | $29 | 500 reservas/mes |
| **Abandoned Cart** | $19 | 200 recuperaciones/mes |
| **Webinar Recovery** | $24 | 100 videos/mes |
| **Invoice Chaser** | $19 | 50 facturas/mes |
| **Voice Brand** | $39 | 100 mensajes/mes |

**O Paquetes:**

| Paquete | Precio/Mes | Agentes Incluidos |
|---------|-----------|-------------------|
| **Starter** | $29 | 1 agente (elige cualquiera) |
| **E-commerce** | $79 | Booking + Abandoned Cart |
| **Complete** | $149 | Todos los agentes |
| **Enterprise** | Custom | Todo + soporte prioritario |

#### Semana 4: White-Label System

**Tareas:**
- [ ] Endpoints para configuración de branding
- [ ] Almacenamiento de logos/colores
- [ ] API para obtener configuración del tenant
- [ ] Validación de archivos

### Fase 2: Frontend Widget (Semanas 5-7)

#### Semana 5-6: JavaScript Widget

**Características:**
- Widget embeddable
- Auto-inicialización
- Estilos personalizables por tenant
- Responsive design
- Chat interface integrado

**Estructura:**

```
frontend-widget/
├── src/
│   ├── widget.ts          # Main widget class
│   ├── chat-interface.ts   # Chat UI
│   ├── calendar.ts        # Calendar picker
│   └── styles.ts         # Dynamic styling
├── dist/
│   └── widget.min.js     # Compiled widget
└── package.json
```

**Ejemplo de Uso:**

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.agentslab.ai/widget.js"></script>
</head>
<body>
  <div id="ai-booking-agent" 
       data-api-key="sk_live_xxx"
       data-business-id="biz_123"
       data-theme="light"
       data-primary-color="#3B82F6">
  </div>
  
  <script>
    AIBookingAgent.init({
      apiKey: 'sk_live_xxx',
      businessId: 'biz_123',
      onBookingConfirmed: (booking) => {
        console.log('Booking confirmed:', booking);
      }
    });
  </script>
</body>
</html>
```

#### Semana 7: WordPress Plugin

**Estructura:**

```
wordpress-plugin/
├── ai-booking-agent.php   # Main plugin file
├── includes/
│   ├── class-widget.php
│   ├── class-shortcode.php
│   └── class-admin.php
├── assets/
│   ├── css/
│   └── js/
└── readme.txt
```

**Funcionalidades:**
- Shortcode: `[ai_booking_agent]`
- Widget para sidebar
- Página de configuración en admin
- Guardado de API Key en settings

### Fase 3: Payment Integration (Semanas 8-10)

#### Semana 8-9: Stripe Connect (Para que negocios cobren)

**Objetivo:** Permitir que cada negocio cobre directamente a sus clientes

**Implementación:**

1. **Stripe Connect Setup**
   - Onboarding de negocios en Stripe Connect
   - OAuth flow para conectar cuentas
   - Almacenamiento de `stripe_account_id`

2. **Payment Flow**
   ```
   Cliente → Booking Agent → Confirma cita → 
   Stripe Payment Intent → Cliente paga → 
   Dinero va a cuenta del negocio (no a nosotros)
   ```

3. **Comisión del SaaS**
   - Fee por transacción (ej: 2.9% + $0.30)
   - O fee fijo por reserva
   - Configurable por plan

**Código Ejemplo:**

```typescript
// backend/src/billing/services/payment.service.ts
async createPaymentIntent(bookingId: string, amount: number) {
  const booking = await this.bookingService.findOne(bookingId);
  const tenant = await this.tenantService.findOne(booking.tenantId);
  
  // Crear payment intent en cuenta del negocio
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // en centavos
    currency: 'eur',
    application_fee_amount: Math.round(amount * 0.029 * 100), // 2.9% comisión
    transfer_data: {
      destination: tenant.stripeAccountId, // Dinero va al negocio
    },
  }, {
    stripeAccount: tenant.stripeAccountId
  });
  
  return paymentIntent;
}
```

#### Semana 10: Testing & Documentation

- [ ] Tests E2E del flujo completo
- [ ] Documentación de API
- [ ] Guías de integración
- [ ] Video tutorials

---

## 💰 Modelo de Monetización

### Opción 1: Suscripción + Comisión

- **Suscripción mensual** por plan
- **Comisión por transacción** (2.9% + $0.30)
- **Ventaja:** Ingresos recurrentes + por uso

### Opción 2: Solo Suscripción

- **Suscripción mensual** más alta
- **Sin comisiones** por transacción
- **Ventaja:** Predecible para el negocio

### Opción 3: Freemium + Pay-per-use

- **Plan Free** con límites
- **Pago por reserva** después del límite
- **Ventaja:** Bajo barrera de entrada

**Recomendación:** Opción 1 (Suscripción + Comisión)

---

## 🔐 Seguridad y Compliance

### Requerimientos:

1. **Autenticación**
   - API Keys con rotación
   - Rate limiting por tenant
   - IP whitelisting (opcional)

2. **Datos**
   - Encriptación en tránsito (HTTPS)
   - Encriptación en reposo
   - GDPR compliance
   - Data isolation entre tenants

3. **Payments**
   - PCI DSS compliance (usando Stripe)
   - No almacenar datos de tarjetas
   - Webhook signature verification

---

## 📊 Analytics y Monitoreo

### Métricas por Tenant:

- Reservas totales
- Tasa de conversión
- Tiempo promedio de respuesta
- Ingresos generados
- Uptime del servicio

### Dashboard para Negocios:

- Métricas en tiempo real
- Exportación de datos
- Reportes personalizados
- Alertas configurables

---

## 🚀 Roadmap de Lanzamiento

### MVP (3 meses)

**Mes 1:**
- ✅ Backend multi-tenant básico
- ✅ API Key authentication
- ✅ JavaScript widget básico

**Mes 2:**
- ✅ Stripe integration
- ✅ WordPress plugin
- ✅ Dashboard básico

**Mes 3:**
- ✅ Testing completo
- ✅ Documentación
- ✅ Beta testing con 5-10 negocios

### V1.0 (Mes 4-6)

- ✅ White-label completo
- ✅ Analytics avanzado
- ✅ Múltiples métodos de pago
- ✅ Soporte multi-idioma

### V2.0 (Mes 7-12)

- ✅ Mobile apps (iOS/Android)
- ✅ Integraciones adicionales (Shopify, WooCommerce)
- ✅ AI avanzado (sentiment analysis, etc.)
- ✅ Marketplace de integraciones

---

## 📝 Checklist de Implementación

### Backend

- [ ] Módulo de Tenant Management
- [ ] Middleware de autenticación multi-tenant
- [ ] Sistema de API Keys
- [ ] Integración con Stripe
- [ ] Stripe Connect para pagos
- [ ] Webhooks de Stripe
- [ ] Sistema de planes y límites
- [ ] White-label API
- [ ] Rate limiting por tenant
- [ ] Logging y monitoring

### Frontend Widget

- [ ] JavaScript widget standalone
- [ ] Chat interface
- [ ] Calendar picker
- [ ] Payment integration
- [ ] Responsive design
- [ ] Custom styling API
- [ ] Error handling
- [ ] Loading states

### WordPress Plugin

- [ ] Plugin structure
- [ ] Shortcode implementation
- [ ] Widget implementation
- [ ] Admin settings page
- [ ] API Key management
- [ ] Styling options
- [ ] Documentation

### Infrastructure

- [ ] Database multi-tenant
- [ ] CDN para widget assets
- [ ] Monitoring (Sentry, DataDog)
- [ ] Backup strategy
- [ ] Scaling plan
- [ ] Security audit

### Business

- [ ] Pricing strategy
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Support system
- [ ] Marketing website
- [ ] Onboarding flow
- [ ] Documentation site

---

## 🎯 Próximos Pasos Inmediatos

1. **Esta Semana:**
   - [ ] Crear módulo `tenant-management` en backend
   - [ ] Implementar middleware de autenticación
   - [ ] Diseñar estructura de base de datos

2. **Próxima Semana:**
   - [ ] Integrar Stripe básico
   - [ ] Crear estructura del widget JavaScript
   - [ ] Prototipo de WordPress plugin

3. **Mes 1:**
   - [ ] MVP funcional
   - [ ] Testing interno
   - [ ] Preparar documentación

---

## 📚 Recursos y Referencias

### Documentación Técnica:
- [Stripe Connect](https://stripe.com/docs/connect)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
- [WordPress Plugin Development](https://developer.wordpress.org/plugins/)

### Competidores a Estudiar:
- Calendly (booking SaaS)
- Acuity Scheduling
- SimplyBook.me

---

## ❓ Preguntas Frecuentes

**Q: ¿Cómo se aísla la data entre tenants?**
A: Cada request incluye `tenant_id` que se usa para filtrar todas las queries. Nunca se mezclan datos entre tenants.

**Q: ¿Qué pasa si un negocio no paga?**
A: El tenant se marca como `suspended`, se bloquea el acceso pero se mantiene la data por 90 días.

**Q: ¿Pueden los negocios exportar sus datos?**
A: Sí, proporcionaremos API y dashboard para exportar todos los datos en formato JSON/CSV.

**Q: ¿Soporta múltiples idiomas?**
A: En V1.0 soportaremos ES/EN, en V2.0 agregaremos más idiomas.

---

**Última actualización:** 2024-12-10
**Versión del Plan:** 1.0
