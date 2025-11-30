# 🔑 Cómo Obtener tu API Key de OpenAI

## 📝 Pasos Rápidos

### 1. Crear Cuenta en OpenAI
1. Ve a: **https://platform.openai.com/**
2. Haz clic en **"Sign Up"** o **"Log In"**
3. Completa el registro (puedes usar Google/Microsoft)

### 2. Obtener API Key
1. Una vez dentro, ve a: **https://platform.openai.com/api-keys**
2. Haz clic en **"Create new secret key"**
3. Dale un nombre (ej: "AI Agents Lab")
4. **¡IMPORTANTE!** Copia la key inmediatamente - solo se muestra una vez
5. La key se verá así: `sk-proj-xxxxxxxxxxxxxxxxxxxxx`

### 3. Agregar Créditos (si es necesario)
- Si es tu primera vez, puede que necesites agregar créditos
- Ve a: **https://platform.openai.com/account/billing**
- Agrega un método de pago
- Los modelos tienen costo por uso (muy económico para pruebas)

### 4. Configurar en el Proyecto

#### Opción A: Editar `.env` directamente
1. Abre el archivo `backend/.env`
2. Reemplaza `sk-proj-your-key-here` con tu API key real:
   ```bash
   OPENAI_API_KEY=sk-proj-tu-key-real-aqui
   ```

#### Opción B: Usar variable de entorno del sistema
```bash
export OPENAI_API_KEY=sk-proj-tu-key-real-aqui
```

### 5. Activar LangChain (Opcional)
Si quieres usar LangChain con tools y memory, edita `.env`:
```bash
AI_PROVIDER=langchain
USE_LANGCHAIN=true
```

---

## 💰 Costos Aproximados

- **GPT-4 Turbo**: ~$0.01 por 1K tokens (muy barato para pruebas)
- **Una conversación típica**: ~$0.01-0.05
- **Para demos**: $5-10 deberían durar bastante tiempo

---

## ⚠️ Seguridad

- **NUNCA** subas tu `.env` a Git
- El archivo `.env` ya está en `.gitignore`
- Si compartes código, usa `.env.example` sin la key real

---

## 🧪 Probar que Funciona

1. Inicia el backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Deberías ver en los logs:
   ```
   LangChainProvider initialized
   ```
   o
   ```
   OpenAiProvider initialized
   ```

3. Si ves errores sobre API key, verifica que:
   - La key esté correcta en `.env`
   - No tenga espacios extra
   - Tengas créditos en tu cuenta de OpenAI

---

## 🆘 Problemas Comunes

### Error: "OPENAI_API_KEY is required"
- Verifica que el archivo `.env` existe en `backend/`
- Verifica que la variable se llama exactamente `OPENAI_API_KEY`
- Reinicia el servidor después de cambiar `.env`

### Error: "Incorrect API key provided"
- Verifica que copiaste la key completa
- Asegúrate de que no tenga espacios al inicio/final
- Verifica que tengas créditos en tu cuenta

### Error: "Rate limit exceeded"
- Has usado muchos tokens muy rápido
- Espera unos minutos o agrega más créditos

---

## 📚 Recursos

- **OpenAI Platform**: https://platform.openai.com/
- **API Keys**: https://platform.openai.com/api-keys
- **Billing**: https://platform.openai.com/account/billing
- **Documentación**: https://platform.openai.com/docs

---

**¡Listo!** Una vez que tengas la API key configurada, el Booking Agent debería funcionar perfectamente. 🚀


