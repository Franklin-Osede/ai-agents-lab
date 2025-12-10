# 🔒 Estrategia de Seguridad Completa - AI Agents Lab

## 🎯 Contexto y Requisitos

### Escenario de Uso

1. **Agentes inyectados en websites de terceros**
   - JavaScript widget en sitios de clientes
   - WordPress plugins
   - Integraciones n8n/Zapier

2. **Conexión con CRMs de clientes**
   - HubSpot, Salesforce, Pipedrive, etc.
   - Datos sensibles de clientes
   - Información de negocios

3. **Multi-tenant**
   - Múltiples negocios en la misma plataforma
   - Aislamiento total de datos
   - Compliance (GDPR, SOC2)

### Riesgos Críticos

1. **Inyección de código malicioso** en websites de clientes
2. **Acceso no autorizado** a datos de CRMs
3. **Fuga de datos** entre tenants
4. **Ataques DDoS** y rate limiting
5. **Man-in-the-middle** en comunicaciones
6. **API key leakage** en frontend

---

## 🛡️ Arquitectura de Seguridad

### Capa 1: Autenticación y Autorización

#### 1.1 API Key Management

**Implementación:**

```typescript
// backend/src/core/security/api-key.service.ts
@Injectable()
export class ApiKeyService {
  async generateApiKey(tenantId: string): Promise<ApiKey> {
    // Generar clave segura
    const key = crypto.randomBytes(32).toString('base64');
    const hashed = await bcrypt.hash(key, 12);
    
    // Almacenar hash (nunca la clave original)
    return {
      id: uuidv4(),
      tenantId,
      keyHash: hashed,
      prefix: key.substring(0, 8), // Para identificación
      scopes: ['agent:booking', 'agent:cart-recovery'], // Permisos
      rateLimit: 1000, // Requests por hora
      expiresAt: null, // O fecha de expiración
      lastUsedAt: null,
      createdAt: new Date()
    };
  }
  
  async validateApiKey(key: string): Promise<Tenant | null> {
    // Buscar por prefix (más rápido)
    const prefix = key.substring(0, 8);
    const apiKey = await this.findByPrefix(prefix);
    
    if (!apiKey) return null;
    
    // Verificar hash
    const isValid = await bcrypt.compare(key, apiKey.keyHash);
    if (!isValid) return null;
    
    // Verificar expiración
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }
    
    // Verificar tenant activo
    const tenant = await this.tenantService.findById(apiKey.tenantId);
    if (!tenant || tenant.status !== 'active') {
      return null;
    }
    
    // Actualizar último uso
    await this.updateLastUsed(apiKey.id);
    
    return tenant;
  }
}
```

**Características:**
- ✅ Claves con prefijo identificable (`sk_live_abc123...`)
- ✅ Hash con bcrypt (nunca almacenar en texto plano)
- ✅ Scopes por agente (permisos granulares)
- ✅ Rate limiting por API key
- ✅ Rotación de claves
- ✅ Revocación inmediata

#### 1.2 JWT para Autenticación de Usuarios

**Para dashboard y admin:**

```typescript
// backend/src/core/security/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### 1.3 OAuth2 para Integraciones CRM

**Flujo OAuth2 para CRMs:**

```typescript
// backend/src/integrations/crm/oauth.service.ts
@Injectable()
export class CrmOAuthService {
  // Paso 1: Iniciar OAuth flow
  async initiateOAuth(tenantId: string, crmType: string) {
    const config = this.getCrmConfig(crmType); // HubSpot, Salesforce, etc.
    
    const state = this.generateStateToken(tenantId);
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Guardar en sesión
    await this.sessionService.save({
      tenantId,
      crmType,
      codeVerifier,
      state
    });
    
    return {
      authorizationUrl: `${config.authUrl}?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${config.redirectUri}&` +
        `response_type=code&` +
        `scope=${config.scopes}&` +
        `state=${state}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`
    };
  }
  
  // Paso 2: Callback después de autorización
  async handleCallback(code: string, state: string) {
    const session = await this.sessionService.findByState(state);
    if (!session) throw new UnauthorizedException('Invalid state');
    
    const config = this.getCrmConfig(session.crmType);
    
    // Intercambiar code por access_token
    const tokens = await this.exchangeCodeForTokens(
      code,
      session.codeVerifier,
      config
    );
    
    // Almacenar tokens encriptados
    await this.storeEncryptedTokens(session.tenantId, {
      accessToken: this.encrypt(tokens.access_token),
      refreshToken: this.encrypt(tokens.refresh_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      crmType: session.crmType
    });
    
    return { success: true };
  }
  
  // Paso 3: Usar tokens para llamadas al CRM
  async callCrm(tenantId: string, endpoint: string, method: string, data?: any) {
    const tokens = await this.getValidTokens(tenantId);
    if (!tokens) throw new UnauthorizedException('CRM not connected');
    
    // Refrescar si es necesario
    if (tokens.expiresAt < new Date()) {
      tokens = await this.refreshTokens(tenantId, tokens);
    }
    
    const accessToken = this.decrypt(tokens.accessToken);
    
    // Llamada al CRM con token
    return this.httpService.request({
      url: `${tokens.crmBaseUrl}${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data
    });
  }
}
```

**Seguridad en OAuth:**
- ✅ PKCE (Proof Key for Code Exchange)
- ✅ State token para prevenir CSRF
- ✅ Tokens encriptados en base de datos
- ✅ Refresh automático de tokens
- ✅ Revocación de acceso

---

### Capa 2: Aislamiento de Datos (Multi-Tenant)

#### 2.1 Row-Level Security

**Middleware de Tenant Isolation:**

```typescript
// backend/src/core/security/tenant.middleware.ts
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Obtener tenant del API key
    const tenant = req['tenant'];
    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }
    
    // Inyectar tenant_id en request para todas las queries
    req['tenantId'] = tenant.id;
    
    // Agregar a contexto de TypeORM
    if (req['queryRunner']) {
      await req['queryRunner'].query(
        `SET LOCAL app.tenant_id = '${tenant.id}'`
      );
    }
    
    next();
  }
}
```

**Database Policies (PostgreSQL):**

```sql
-- Habilitar RLS (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Solo ver tus propios datos
CREATE POLICY tenant_isolation_policy ON bookings
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Aplicar a todas las tablas
CREATE POLICY tenant_isolation_policy ON carts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

#### 2.2 Validación en Cada Query

```typescript
// Ejemplo: Booking Repository
async findById(id: string, tenantId: string): Promise<Booking> {
  // SIEMPRE incluir tenantId en queries
  return this.repository.findOne({
    where: { id, tenantId } // Doble validación
  });
}
```

---

### Capa 3: Rate Limiting y DDoS Protection

#### 3.1 Rate Limiting por Tenant

```typescript
// backend/src/core/security/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly cache: Cache,
    private readonly tenantService: TenantService
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenant = request['tenant'];
    
    if (!tenant) return false;
    
    const key = `rate_limit:${tenant.id}:${request.ip}`;
    const current = await this.cache.get(key) || 0;
    
    // Límite según plan
    const limit = tenant.plan === 'enterprise' ? 10000 : 1000;
    
    if (current >= limit) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    
    await this.cache.set(key, current + 1, 3600); // 1 hora
    
    return true;
  }
}
```

#### 3.2 DDoS Protection

**Implementar:**
- Cloudflare o AWS WAF
- IP whitelisting opcional
- Request throttling
- Bot detection

---

### Capa 4: Encriptación de Datos

#### 4.1 Encriptación en Tránsito

```typescript
// Siempre HTTPS
// TLS 1.3 mínimo
// Certificados SSL válidos
// HSTS headers
```

#### 4.2 Encriptación en Reposo

```typescript
// backend/src/core/security/encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.ENCRYPTION_KEY; // 32 bytes
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV + AuthTag + Encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**Datos a encriptar:**
- ✅ Tokens OAuth (access_token, refresh_token)
- ✅ API keys de terceros
- ✅ Credenciales de CRM
- ✅ Datos sensibles de clientes (opcional, según compliance)

---

### Capa 5: Seguridad del Widget (Frontend)

#### 5.1 Content Security Policy (CSP)

```html
<!-- En el widget JavaScript -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.agentslab.ai; 
               connect-src 'self' https://api.agentslab.ai;
               style-src 'self' 'unsafe-inline';">
```

#### 5.2 API Key en Frontend (Problema de Seguridad)

**❌ NUNCA hacer esto:**
```javascript
// MAL - API key expuesta en frontend
const API_KEY = 'sk_live_abc123...';
```

**✅ Solución: Proxy Backend**

```typescript
// Opción 1: Proxy en backend del cliente
// El cliente tiene su propio backend que hace las llamadas

// Opción 2: Session-based authentication
// Widget obtiene token temporal del backend del cliente
```

**✅ Solución Recomendada: Domain Whitelisting**

```typescript
// backend/src/core/security/domain-whitelist.service.ts
@Injectable()
export class DomainWhitelistService {
  async validateRequest(apiKey: string, origin: string): Promise<boolean> {
    const tenant = await this.apiKeyService.getTenant(apiKey);
    const whitelistedDomains = tenant.allowedDomains;
    
    // Extraer dominio del origin
    const requestDomain = new URL(origin).hostname;
    
    // Verificar si está en whitelist
    return whitelistedDomains.some(domain => 
      requestDomain === domain || 
      requestDomain.endsWith(`.${domain}`)
    );
  }
}
```

**Flujo:**
1. Cliente registra sus dominios permitidos en dashboard
2. Widget hace request con `Origin` header
3. Backend valida que el dominio esté en whitelist
4. Si no está → Rechazar request

---

### Capa 6: Webhook Security

#### 6.1 Firma de Webhooks

```typescript
// backend/src/core/security/webhook.service.ts
@Injectable()
export class WebhookService {
  async signPayload(payload: any, secret: string): Promise<string> {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  async verifySignature(
    payload: any, 
    signature: string, 
    secret: string
  ): Promise<boolean> {
    const expectedSignature = await this.signPayload(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
```

**Uso:**
```typescript
// Enviar webhook
const signature = await webhookService.signPayload(data, tenant.webhookSecret);
await http.post(tenant.webhookUrl, data, {
  headers: {
    'X-Signature': signature,
    'X-Timestamp': Date.now()
  }
});

// Recibir webhook (del CRM)
const signature = request.headers['x-signature'];
const isValid = await webhookService.verifySignature(
  request.body,
  signature,
  tenant.webhookSecret
);
```

---

### Capa 7: Audit Logging

#### 7.1 Logging de Todas las Acciones

```typescript
// backend/src/core/security/audit.service.ts
@Injectable()
export class AuditService {
  async log(action: AuditAction) {
    await this.auditRepository.create({
      tenantId: action.tenantId,
      userId: action.userId,
      action: action.type, // 'api_call', 'crm_sync', 'data_access'
      resource: action.resource,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      timestamp: new Date(),
      metadata: action.metadata
    });
  }
}
```

**Eventos a loggear:**
- ✅ Todas las llamadas API
- ✅ Accesos a CRMs
- ✅ Cambios de configuración
- ✅ Accesos a datos sensibles
- ✅ Errores de autenticación
- ✅ Cambios de permisos

---

### Capa 8: Compliance y Regulaciones

#### 8.1 GDPR Compliance

**Requisitos:**
- ✅ Right to access (exportar datos)
- ✅ Right to deletion (eliminar datos)
- ✅ Data portability
- ✅ Privacy by design
- ✅ Data processing agreements

**Implementación:**

```typescript
// backend/src/compliance/gdpr.service.ts
@Injectable()
export class GdprService {
  async exportUserData(tenantId: string): Promise<GdprExport> {
    // Exportar todos los datos del tenant
    return {
      bookings: await this.bookingRepo.findByTenant(tenantId),
      customers: await this.customerRepo.findByTenant(tenantId),
      settings: await this.settingsRepo.findByTenant(tenantId),
      // ...
    };
  }
  
  async deleteUserData(tenantId: string): Promise<void> {
    // Eliminar todos los datos (soft delete o hard delete)
    await this.bookingRepo.deleteByTenant(tenantId);
    await this.customerRepo.deleteByTenant(tenantId);
    // ...
  }
}
```

#### 8.2 SOC2 Type II

**Requisitos:**
- ✅ Access controls
- ✅ Encryption
- ✅ Monitoring
- ✅ Incident response
- ✅ Change management

---

## 🔧 Implementación Técnica

### Estructura de Archivos

```
backend/src/
├── core/
│   ├── security/
│   │   ├── api-key.service.ts
│   │   ├── api-key.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── rate-limit.guard.ts
│   │   ├── tenant.middleware.ts
│   │   ├── encryption.service.ts
│   │   ├── webhook.service.ts
│   │   └── audit.service.ts
│   │
│   ├── integrations/
│   │   ├── crm/
│   │   │   ├── oauth.service.ts
│   │   │   ├── hubspot.adapter.ts
│   │   │   ├── salesforce.adapter.ts
│   │   │   └── pipedrive.adapter.ts
│   │   │
│   │   └── webhook/
│   │       ├── webhook.controller.ts
│   │       └── webhook.validator.ts
│   │
│   └── compliance/
│       ├── gdpr.service.ts
│       └── data-retention.service.ts
```

### Middleware Stack

```typescript
// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        HelmetMiddleware,        // Security headers
        CorsMiddleware,           // CORS config
        TenantIsolationMiddleware, // Tenant injection
        RateLimitMiddleware,      // Rate limiting
        AuditMiddleware          // Logging
      )
      .forRoutes('*');
  }
}
```

---

## 📋 Checklist de Seguridad

### Autenticación
- [ ] API Keys con hash (bcrypt)
- [ ] JWT para usuarios
- [ ] OAuth2 para CRMs (PKCE)
- [ ] Rotación de claves
- [ ] Revocación inmediata

### Autorización
- [ ] Scopes por agente
- [ ] Permisos granulares
- [ ] Domain whitelisting
- [ ] IP whitelisting (opcional)

### Aislamiento
- [ ] Row-level security en DB
- [ ] Tenant ID en todas las queries
- [ ] Validación doble
- [ ] Sin datos compartidos

### Encriptación
- [ ] HTTPS obligatorio (TLS 1.3)
- [ ] Tokens encriptados en DB
- [ ] Secrets encriptados
- [ ] Key management (AWS KMS/HashiCorp Vault)

### Rate Limiting
- [ ] Por API key
- [ ] Por IP
- [ ] Por endpoint
- [ ] DDoS protection

### Webhooks
- [ ] Firma HMAC
- [ ] Timestamp validation
- [ ] Retry logic
- [ ] Idempotency

### Compliance
- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Audit logging
- [ ] Privacy policy
- [ ] Terms of service

### Monitoring
- [ ] Security events logging
- [ ] Anomaly detection
- [ ] Alertas automáticas
- [ ] Incident response plan

---

## 🚨 Incident Response Plan

### 1. Detección
- Monitoring 24/7
- Alertas automáticas
- Anomaly detection

### 2. Contención
- Revocar API keys comprometidas
- Bloquear IPs maliciosas
- Aislar tenant afectado

### 3. Investigación
- Audit logs
- Forensics
- Root cause analysis

### 4. Recuperación
- Restaurar desde backups
- Notificar a clientes afectados
- Implementar fix

### 5. Prevención
- Actualizar políticas
- Mejorar controles
- Training

---

## 🎯 Prioridades de Implementación

### Fase 1: Crítico (Semana 1-2)
- [ ] API Key management seguro
- [ ] Tenant isolation middleware
- [ ] Rate limiting básico
- [ ] HTTPS enforcement
- [ ] Domain whitelisting

### Fase 2: Importante (Semana 3-4)
- [ ] OAuth2 para CRMs
- [ ] Encriptación de tokens
- [ ] Webhook signing
- [ ] Audit logging básico

### Fase 3: Compliance (Semana 5-6)
- [ ] GDPR compliance
- [ ] Data retention
- [ ] Privacy controls
- [ ] Documentation

### Fase 4: Avanzado (Semana 7-8)
- [ ] SOC2 preparation
- [ ] Advanced monitoring
- [ ] Penetration testing
- [ ] Security audit

---

## 📚 Recursos y Referencias

### Estándares
- OWASP Top 10
- OAuth2 RFC 6749
- PKCE RFC 7636
- GDPR Regulation
- SOC2 Type II

### Herramientas
- AWS WAF / Cloudflare
- HashiCorp Vault (secrets)
- Sentry (monitoring)
- OWASP ZAP (testing)

---

**Última actualización:** 2024-12-10
**Prioridad:** CRÍTICA - Implementar Fase 1 esta semana
