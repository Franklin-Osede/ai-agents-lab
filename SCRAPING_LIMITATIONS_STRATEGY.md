# Scraping Limitations & Best Practices Strategy

## 1. Riesgos de Bloqueo y Detección

Las webs modernas tienen defensas (Cloudflare, Akamai).

- **Riesgo**: Puppeteer "puro" es detectable (fingerprint del navegador).
- **Mitigación**: Hemos instalado `puppeteer-extra-plugin-stealth`. Esto oculta que somos un robot (elimina `navigator.webdriver`, simula plugins, etc.).

## 2. Throttling y Respeto (La Ética del Bot)

Si lanzas 50 peticiones por segundo a la web de una clínica pequeña, la tumbarás (DoS attack).

- **Regla**: Implementaremos un delay aleatorio de 1-3 segundos entre peticiones.
- **Config**:
  ```typescript
  const randomDelay = Math.floor(Math.random() * 2000) + 1000;
  await new Promise((r) => setTimeout(r, randomDelay));
  ```

## 3. Webs Dinámicas (SPA - React/Angular)

Muchas webs cargan el contenido después (Client Side Rendering).

- **Solución**: Puppeteer debe esperar a la "inactividad de red".
- **Código**: `await page.goto(url, { waitUntil: 'networkidle0' });`

## 4. Estructura Caótica

- **Problema**: El HTML es una sopa de `divs`.
- **Estrategia**: No intentar parsear selectores CSS específicos (`.precio-container`). Usar **Readability** (algoritmo usado por Firefox Reader Mode) para extraer el texto principal y eliminar menús/ads.

## 5. Captcha

- **Límite Duro**: Si hay un Captcha (Google ReCaptcha), el bot morirá.
- **Solución Demo**: Detectar el bloqueo y pedir al usuario que suba un PDF/Texto manual en su lugar. No intentaremos romper captchas (ilegal/caro).
