# 🔐 Configuración de Twilio - Agentics

## Credenciales (NO compartir en código público)

**Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (reemplazar con tu Account SID real)  
**Auth Token:** `your_auth_token_here` (reemplazar con tu Auth Token real)  
**Compañía:** Agentics

## Configuración en .env

Agrega estas variables a `backend/.env`:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL
FRONTEND_URL=http://localhost:4200

# Business ID
BUSINESS_ID=agentics
```

## Próximos Pasos

1. ✅ Credenciales configuradas
2. ⏳ Configurar WhatsApp Sandbox (unirse al número de prueba)
3. ⏳ Probar envío de mensajes
4. ⏳ Integrar con frontend

## Nota de Seguridad

⚠️ **IMPORTANTE:** Este archivo contiene credenciales sensibles.  
- ✅ Agregar a `.gitignore`  
- ✅ No subir a repositorios públicos  
- ✅ Usar variables de entorno en producción

