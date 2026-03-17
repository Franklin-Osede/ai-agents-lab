import { Injectable, Logger } from '@nestjs/common';
import { IScraperService, ScrapedPage } from '../../domain/repositories/scraping.service';
import { ChatOpenAI } from '@langchain/openai';
import axios from 'axios';

@Injectable()
export class SimpleScraperService implements IScraperService {
  private readonly logger = new Logger(SimpleScraperService.name);
  private readonly openai: ChatOpenAI;

  constructor() {
    this.openai = new ChatOpenAI({
      modelName: 'gpt-4-turbo',
      maxTokens: 3000,
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    try {
      this.logger.log(`🚀 Scraping ${url} with simple fetch...`);
      const startTime = Date.now();

      // 1. Fetch HTML (1-2 seconds)
      const html = await this.fetchHTML(url);
      this.logger.debug(`✅ HTML fetched in ${Date.now() - startTime}ms`);

      // 1.5 SMART CONTACT FETCH: Check for contact links
      // 1.5 SMART CONTACT FETCH: Check for contact links
      // Improved Regex: checks href or text content for "contact" or "contacto"
      const contactLinkPattern =
        /<a[^>]+href=["']([^"']*)["'][^>]*>(?:(?!(?:<\/a>)).)*(?:contacto|contact|donde estamos)(?:(?!(?:<\/a>)).)*<\/a>|<a[^>]+href=["']([^"']*(?:contacto|contact)[^"']*)["'][^>]*>/i;
      const contactMatch = html.match(contactLinkPattern);

      let contactHtmlContent = '';
      if (contactMatch) {
        let contactUrl = contactMatch[1] || contactMatch[2]; // Captures from text match or href match
        if (contactUrl) {
          // Ensure absolute URL
          if (!contactUrl.startsWith('http')) {
            try {
              contactUrl = new URL(contactUrl, url).href;
            } catch (e) {
              // Invalid URL
            }
          }

          if (contactUrl.startsWith('http')) {
            this.logger.log(`🔎 Found potential contact page: ${contactUrl}. Fetching...`);
            try {
              const contactResp = await this.fetchHTML(contactUrl);
              contactHtmlContent = contactResp;
              this.logger.debug(`✅ Contact page fetched (${contactResp.length} chars)`);
            } catch (e) {
              this.logger.warn(`⚠️ Could not fetch contact page: ${e.message}`);
            }
          }
        }
      }

      // 1.6 SMART TEAM FETCH: Check for team/about links
      const teamLinkPattern =
        /<a[^>]+href=["']([^"']*)["'][^>]*>(?:(?!(?:<\/a>)).)*(?:quienes somos|quiénes somos|equipo|doctores|nosotros|team|about)(?:(?!(?:<\/a>)).)*<\/a>|<a[^>]+href=["']([^"']*(?:quienes-somos|equipo|nosotros|team|about)[^"']*)["'][^>]*>/i;
      const teamMatch = html.match(teamLinkPattern);

      let teamHtmlContent = '';
      if (teamMatch) {
        let teamUrl = teamMatch[1] || teamMatch[2];
        if (teamUrl) {
          if (!teamUrl.startsWith('http')) {
            try {
              teamUrl = new URL(teamUrl, url).href;
            } catch (e) {
              // Invalid URL
            }
          }

          if (teamUrl.startsWith('http')) {
            this.logger.log(`🔎 Found potential team page: ${teamUrl}. Fetching...`);
            try {
              const teamResp = await this.fetchHTML(teamUrl);
              teamHtmlContent = teamResp;
              this.logger.debug(`✅ Team page fetched (${teamResp.length} chars)`);
            } catch (e) {
              this.logger.warn(`⚠️ Could not fetch team page: ${e.message}`);
            }
          }
        }
      }

      // 1.7 EXTRACT JSON-LD (Rich Snippets)
      const jsonLdMatches = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
      );
      let jsonLdContent = '';
      if (jsonLdMatches) {
        jsonLdContent = jsonLdMatches
          .map((script) => script.replace(/<\/?script[^>]*>/g, ''))
          .join('\n\n');
        this.logger.debug(`✅ Extracted ${jsonLdMatches.length} JSON-LD blocks`);
      }

      // 2. Clean HTML (0.5 seconds)
      const cleanHtml = this.cleanHTML(html);

      // Combine contents for GPT-4
      // CRITICAL: Construct Home Context smartly.
      // - Header (first ~15k) for nav and main info
      // - Footer (last ~15k) for contact info and address
      let homeContext = cleanHtml;
      if (cleanHtml.length > 35000) {
        const firstChunk = cleanHtml.substring(0, 20000);
        const lastChunk = cleanHtml.substring(cleanHtml.length - 15000);
        homeContext = `${firstChunk}\n\n...[CONTENIDO RECORTADO]...\n\n${lastChunk}`;
        this.logger.debug(
          `✅ Smart Homepage Truncation: Kept Header+Footer (${homeContext.length} chars)`,
        );
      }

      let finalContext = homeContext;

      if (teamHtmlContent) {
        finalContext += `\n\n=== CONTENIDO DE PAGINA DE EQUIPO/NOSOTROS ===\n${this.cleanHTML(
          teamHtmlContent,
        ).substring(0, 15000)}`;
      }

      if (contactHtmlContent) {
        finalContext += `\n\n=== CONTENIDO DE PAGINA DE CONTACTO ===\n${this.cleanHTML(
          contactHtmlContent,
        ).substring(0, 15000)}`;
      }

      if (jsonLdContent) {
        finalContext += `\n\n=== DATOS ESTRUCTURADOS JSON-LD (MUY IMPORTANTE) ===\n${jsonLdContent}`;
      }

      this.logger.debug(`✅ Final context size: ${finalContext.length} chars`);

      // 3. Parse with GPT-4 (2-3 seconds)
      const data = await this.parseWithGPT(finalContext, url);

      // 4. FALLBACK HEURISTICS (If GPT missed critical info)
      if (!data.contact) {
        data.contact = {};
      }

      if (!data.contact.hours || data.contact.hours.includes('no detectado')) {
        const hoursRegex =
          /(?:Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo|L-V|L - V)[\s\S]{0,50}\d{1,2}[:.](?:00|30)/i;
        const hoursMatch = cleanHtml.match(hoursRegex);
        if (hoursMatch) {
          // Take a safe chunk around the match
          const matchIndex = hoursMatch.index || 0;
          const extractedHours = cleanHtml.substring(matchIndex, matchIndex + 100);
          data.contact.hours = extractedHours.replace(/\s+/g, ' ').trim();
          this.logger.log(`⚠️ GPT missed hours, found via Regex: ${data.contact.hours}`);
        }
      }

      // Check if team is empty and try to find Doctors manually if needed
      if (teamHtmlContent && (!data.team || data.team.length === 0)) {
        // Simple heuristic for "Dr. Name" or "Dra. Name"
        const doctorRegex =
          /(?:Dr\.|Dra\.|Doctor|Doctora)\s+([A-ZÁÉÍÓÚÑ][a-zKbáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-zKbáéíóúñ]+){1,2})/g;
        const matches = [...this.cleanHTML(teamHtmlContent).matchAll(doctorRegex)];

        if (matches.length > 0) {
          data.team = matches
            .map((m) => ({
              name: m[0], // Full match with title
              role: 'Odontólogo/a (Detectado por Regex)',
              image: '',
            }))
            .slice(0, 5); // Limit to top 5
          this.logger.log(`⚠️ GPT missed team, found ${matches.length} doctors via Regex`);
        }
      }

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ Scraping completed in ${totalTime}ms (~${(totalTime / 1000).toFixed(1)}s)`,
      );

      return data;
    } catch (error) {
      this.logger.error(`❌ Scraping failed for ${url}`, error);
      throw error;
    }
  }

  private async fetchHTML(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout after 5 seconds');
      }
      throw error;
    }
  }

  private cleanHTML(html: string): string {
    return (
      html
        // Remove scripts
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove styles
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove SVG (can be large)
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private async parseWithGPT(html: string, url: string): Promise<ScrapedPage> {
    // INCREASE LIMIT: We constructed a safe context up to ~50-60k chars.
    // GPT-4 Turbo 128k context can handle this easily.
    // Do NOT re-truncate drastically or we lose the contact info at the end.
    const htmlChunk = html.substring(0, 80000);
    this.logger.debug(`Sending ${htmlChunk.length} chars to GPT-4`);

    const prompt = `Analiza este HTML de una página web de negocio y extrae información estructurada.

URL: ${url}

HTML (primeros 40000 caracteres, incluye header Y footer):
${htmlChunk}

Extrae la siguiente información y devuelve SOLO JSON válido:

{
  "businessName": "Nombre del negocio (del <title>, <h1>, o meta tags)",
  "logo": "URL completa del logo (busca <img> con 'logo' en src/alt/class)",
  "colors": {
    "primary": "Color principal #RRGGBB",
    "secondary": "Color secundario #RRGGBB"
  },
  "services": [
    "Lista de TODOS los servicios (busca en <nav>, menús, listas)"
  ],
  "team": [
    {
      "name": "Nombre completo del profesional",
      "role": "Rol/especialidad",
      "image": "URL completa de la foto (si existe)"
    }
  ],
  "contact": {
    "phone": "Teléfono completo",
    "email": "Email",
    "address": "Dirección completa",
    "hours": "Horario (ej: Lunes-Viernes: 9:00-20:00)"
  },
  "navbarSections": [
    {
      "name": "Nombre de sección",
      "items": ["item1", "item2"]
    }
  ]
}

INSTRUCCIONES CRÍTICAS:

1. **TELÉFONO** (MUY IMPORTANTE):
   - Busca en <header>, <footer> (al final del todo), y secciones de contacto.
   - Prioriza números españoles (+34 o empiezan por 9/6).

2. **HORARIO** (MUY IMPORTANTE):
   - Busca "Horario", "Opening Hours", "Lunes a Viernes".
   - Suele estar en el FOOTER o en la sección de CONTACTO.
   - Extrae el texto completo, ej: "Lunes a Viernes 10:00-14:00 y 16:00-20:00".

3. **EQUIPO / DOCTORES** (MUY IMPORTANTE):
   - He incluido el contenido de la página "Quienes Somos" o "Equipo" más abajo.
   - Busca listas de personas con cargos (Dr., Dra., Higienista, Director).
   - Extrae Nombre, Cargo y URL de Foto si es posible.
   - IGNORA testimonios de clientes. Solo personal del negocio.

4. **EMAIL**:
   - Busca <a href="mailto:...">.

   - Busca texto con @ (info@, contacto@, hola@)
   - Busca en <footer>, secciones de contacto

3. **DIRECCIÓN** (MUY IMPORTANTE):
   - Busca en <footer>, sección "Contacto", "Dónde estamos"
   - Incluye calle, número, código postal, ciudad
   - Ejemplo: "Calle Mayor 123, 28013 Madrid"

4. **HORARIO**:
   - Busca "Horario", "Abierto", "Lunes", "L-V"
   - Formato: "Lunes-Viernes: 9:00-20:00"

IMPORTANTE:
- Sé EXHAUSTIVO buscando teléfono, email y dirección
- Mira TODO el HTML, especialmente <footer>
- Si no encuentras algo, usa string vacío ""
- Devuelve SOLO JSON, sin markdown`;

    const result = await this.openai.invoke([{ role: 'user', content: prompt }]);

    const content = result.content.toString();
    const jsonStr = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      this.logger.error('Failed to parse GPT response as JSON', jsonStr);
      throw new Error('GPT returned invalid JSON');
    }

    // Convert relative logo URL to absolute
    let logoUrl = parsed.logo || '';
    if (logoUrl && !logoUrl.startsWith('http')) {
      try {
        logoUrl = new URL(logoUrl, url).href;
      } catch (e) {
        this.logger.warn(`Failed to convert logo URL: ${logoUrl}`);
      }
    }

    // Log extracted contact info for debugging
    this.logger.log('📞 Contact Info Extracted:');
    this.logger.log(`  Phone: ${parsed.contact?.phone || '❌ NOT FOUND'}`);
    this.logger.log(`  Email: ${parsed.contact?.email || '❌ NOT FOUND'}`);
    this.logger.log(`  Address: ${parsed.contact?.address || '❌ NOT FOUND'}`);
    this.logger.log(`  Hours: ${parsed.contact?.hours || '❌ NOT FOUND'}`);

    return {
      url,
      title: parsed.businessName || 'Unknown Business',
      content: html.substring(0, 10000),
      branding: {
        logo: logoUrl,
        colors: {
          primary: parsed.colors?.primary || '#000000',
          secondary: parsed.colors?.secondary || '#666666',
          background: '#ffffff',
          text: '#000000',
        },
        businessName: parsed.businessName,
        phone: parsed.contact?.phone || '',
        email: parsed.contact?.email || '',
        address: parsed.contact?.address || '',
        hours: parsed.contact?.hours || '',
        services: parsed.services || [],
        navbarSections: parsed.navbarSections || [],
      },
      team: parsed.team || [],
      blogPosts: [],
      faqs: [],
    };
  }
}
