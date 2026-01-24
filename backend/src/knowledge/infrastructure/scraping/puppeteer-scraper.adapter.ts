import { Injectable, Logger } from '@nestjs/common';
import { IScraperService, ScrapedPage } from '../../domain/repositories/scraping.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page, HTTPRequest } from 'puppeteer';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface BlogPost {
  title: string;
  url: string;
}

interface NavbarSection {
  name: string;
  items?: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ScrapedData {
  content: string;
  businessName: string;
  branding: {
    logo: string;
    colors: { primary: string; secondary?: string };
    phone: string;
    email: string;
    hours: string;
    address?: string;
    services: string[];
    navbarSections?: NavbarSection[];
    insurance?: string[];
  };
  team: TeamMember[];
  blogPosts: BlogPost[];
  faqs: FaqItem[];
  testimonials?: string[];
  // AI intermediate data
  jsonLd?: any[];
  mapsUrl?: string;
  imageCandidates?: any[];
}

@Injectable()
export class PuppeteerScraperAdapter implements IScraperService {
  private readonly logger = new Logger(PuppeteerScraperAdapter.name);

  constructor() {
    puppeteer.use(StealthPlugin());
  }

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    let browser: Browser | null = null;
    try {
      this.logger.log(`Launching Puppeteer for ${url} (Strict/Clean Mode)`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const mainPage = await browser.newPage();
      await this.configurePage(mainPage);

      this.logger.debug(`Navigating to Home: ${url}`);
      await this.robustGoto(mainPage, url);

      // Auto-scroll to load lazy-loaded images
      try {
        await mainPage.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for images to load
        await mainPage.evaluate(() => {
          window.scrollTo(0, 0); // Scroll back to top
        });
      } catch (e) {
        this.logger.warn('Auto-scroll failed, continuing...');
      }

      // 1. EXTRACT DATA FROM HOME
      const homeData = await this.extractAllData(mainPage);
      let screenshot: string | undefined;

      try {
        const buffer = await mainPage.screenshot({
          type: 'jpeg',
          quality: 60,
          encoding: 'base64',
          fullPage: true, // Capture entire page
        });
        screenshot = buffer as string;
      } catch (e) {
        this.logger.warn('Failed to capture screenshot');
      }

      // 2. DISCOVER SUBPAGES
      const links = await this.findRelevantLinks(mainPage, url);

      // Add manual fallbacks for Team pages if not found
      const commonTeamPaths = ['/equipo', '/profesionales', '/nosotros', '/team', '/quienes-somos'];
      commonTeamPaths.forEach((path) => {
        const full = new URL(path, url).href;
        if (!links.includes(full)) {
          links.push(full);
        }
      });

      this.logger.log(`Found relevant subpages (incl. fallbacks): ${links.join(', ')}`);

      // 3. DEEP SCRAPE
      if (!browser) throw new Error('Browser instance lost');
      const browserInstance = browser;

      const subPageResults = await Promise.all(
        links.map(async (link) => {
          try {
            const page = await browserInstance.newPage();
            await this.configurePage(page);
            await this.robustGoto(page, link);
            const data = await this.extractAllData(page);

            // EXPLICITLY call _extractTeam for team-related pages
            if (
              link.includes('/equipo') ||
              link.includes('/team') ||
              link.includes('/profesionales')
            ) {
              const teamMembers = await this._extractTeam(page);
              if (teamMembers.length > 0) {
                this.logger.log(`✅ _extractTeam found ${teamMembers.length} members on ${link}`);
                data.team = teamMembers.map((m) => ({ ...m, image: '' })); // Override with better extraction
              }
            }

            await page.close();
            return { link, data };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Failed to scrape subpage ${link}: ${msg}`);
            return null;
          }
        }),
      );

      // 4. MERGE DATA (with deduplication)
      const mergedBranding = { ...homeData.branding };
      const mergedTeam: TeamMember[] = [...(homeData.team || [])];
      const mergedBlog: BlogPost[] = [...(homeData.blogPosts || [])];
      const mergedFaqs: FaqItem[] = [...(homeData.faqs || [])];

      subPageResults.forEach((res) => {
        if (!res) return;
        const data = res.data;

        // Merge Team (with better deduplication)
        data.team?.forEach((member) => {
          const normalizedName = member.name.toLowerCase().trim();
          const isDuplicate = mergedTeam.some(
            (m) => m.name.toLowerCase().trim() === normalizedName,
          );
          if (!isDuplicate && member.name.length > 3) {
            mergedTeam.push(member);
          }
        });

        // Merge Blog
        data.blogPosts?.forEach((post) => {
          if (!mergedBlog.find((p) => p.url === post.url)) {
            mergedBlog.push(post);
          }
        });

        // Merge FAQs
        data.faqs?.forEach((faq) => {
          if (!mergedFaqs.find((f) => f.question === faq.question)) {
            mergedFaqs.push(faq);
          }
        });

        // Branding (only fill missing fields)
        if (!mergedBranding.phone && data.branding?.phone) {
          mergedBranding.phone = data.branding.phone;
        }
        if (!mergedBranding.hours && data.branding?.hours) {
          mergedBranding.hours = data.branding.hours;
        }
        if (!mergedBranding.address && data.branding?.address) {
          mergedBranding.address = data.branding.address;
        }
        if (!mergedBranding.email && data.branding?.email) {
          mergedBranding.email = data.branding.email;
        }
      });

      return {
        url,
        title: homeData.businessName || '',
        content: homeData.content,
        screenshot,
        branding: {
          ...mergedBranding,
          colors: {
            primary: mergedBranding.colors.primary,
            secondary: '#000000', // Default
            background: '#ffffff', // Default
            text: '#000000', // Default
          },
        },
        team: mergedTeam,
        blogPosts: mergedBlog,
        faqs: mergedFaqs,
      };
    } catch (e) {
      this.logger.error(`Scraping failed for ${url}`, e);
      throw e;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async configurePage(page: Page) {
    await page.setViewport({ width: 1366, height: 768 });
    // Updated to a newer User-Agent to look more like a real user
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    );
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      // Selectively allow logo and header images for branding extraction
      if (['image', 'media'].includes(req.resourceType())) {
        const url = req.url().toLowerCase();
        // Allow logos, headers, and brand images
        if (
          url.includes('logo') ||
          url.includes('header') ||
          url.includes('brand') ||
          url.includes('icon')
        ) {
          void req.continue();
        } else {
          void req.abort();
        }
      } else {
        void req.continue();
      }
    });
  }

  private async robustGoto(page: Page, url: string) {
    // Increased timeout to 60s to handle slow sites or heavy loads
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
      this.logger.warn(`Initial navigation failed, retrying with simple load... ${e}`);
      // Fallback: try waiting just for domcontentloaded if networkidle2 fails
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
  }

  private async findRelevantLinks(page: Page, baseUrl: string): Promise<string[]> {
    return await page.evaluate((url: string) => {
      // Strategy: Extract ALL menu/navigation links (universal approach)
      const menuSelectors = [
        'header a',
        'nav a',
        '.menu a',
        '.navigation a',
        '[role="navigation"] a',
        '.navbar a',
        '.header a',
      ];

      const menuLinks = new Set<string>();

      // Extract links from navigation areas
      menuSelectors.forEach((selector) => {
        const links = document.querySelectorAll(selector);
        links.forEach((a) => {
          const href = (a as HTMLAnchorElement).getAttribute('href');
          if (
            href &&
            !href.startsWith('#') &&
            !href.startsWith('tel:') &&
            !href.startsWith('mailto:')
          ) {
            try {
              const fullUrl = new URL(href, url).href;
              // Only include links from same domain
              if (fullUrl.startsWith(url) && fullUrl !== url) {
                menuLinks.add(fullUrl);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
      });

      // Fallback: If no menu links found, use keyword-based search
      if (menuLinks.size === 0) {
        const keywords = [
          'equipo',
          'team',
          'servicios',
          'tratamientos',
          'nosotros',
          'about',
          'blog',
          'legal',
          'aviso',
          'privacidad',
          'contacto',
          'contact',
        ];
        const allAnchors = Array.from(document.querySelectorAll('a'));

        allAnchors.forEach((a) => {
          const href = a.getAttribute('href');
          if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('tel:') ||
            href.startsWith('mailto:')
          )
            return;

          try {
            const fullUrl = new URL(href, url).href;
            if (!fullUrl.startsWith(url)) return;

            const text = a.textContent?.toLowerCase() || '';
            const urlLower = fullUrl.toLowerCase();

            if (keywords.some((k) => text.includes(k) || urlLower.includes(k))) {
              menuLinks.add(fullUrl);
            }
          } catch (e) {
            // Invalid URL, skip
          }
        });
      }

      // Limit to 8 links for speed (homepage AI vision captures most info)
      return Array.from(menuLinks).slice(0, 8);
    }, baseUrl);
  }

  private async _extractTeam(page: Page): Promise<{ name: string; role: string }[]> {
    // 3. Extract Members (Robust TreeWalker Approach)
    console.log('--- Extracting Team Members (Browser Context - TreeWalker) ---');
    // Define interface for candidate in browser context
    interface Candidate {
      name: string;
      role: string;
    }

    const members = await page.evaluate(() => {
      const candidates: Candidate[] = [];

      // Helper: Check if a node is likely a name
      const isName = (text: string) => {
        const clean = text.trim();
        return (
          clean.length > 3 &&
          clean.length < 30 &&
          /^[A-ZÁÉÍÓÚÑ]/.test(clean) && // Starts with capital
          !/\d/.test(clean) && // No numbers
          clean.split(' ').length >= 2 && // At least name + surname
          clean.split(' ').length <= 4
        );
      };

      // Strategy: Find known members or pattern matching
      // We know "Alberto" is there from debug. Let's find him and his peers.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim() || '';
        // Contextual checks
        if (isName(text)) {
          let current: HTMLElement | null = node.parentElement;
          let depth = 0;

          // Traverse up to 3 levels to find a header
          while (current && depth < 3) {
            const tag = current.tagName.toLowerCase();
            const isHeaderTag = ['h2', 'h3', 'h4', 'strong', 'b'].includes(tag);
            const hasTitleClass =
              current.className &&
              typeof current.className === 'string' &&
              (current.className.includes('header') ||
                current.className.includes('title') ||
                current.className.includes('name'));

            // Specific check for Marchante Gago structure (from debug)
            // <h2 class="et_pb_module_header">Alberto...</h2>
            const isDiviHeader =
              tag === 'h2' &&
              current.className &&
              current.className.includes('et_pb_module_header');

            if (isDiviHeader || (isHeaderTag && hasTitleClass)) {
              candidates.push({ name: text, role: 'Especialista' });
              break; // Stop climbing if found
            }

            current = current.parentElement;
            depth++;
          }
        }
      }

      return candidates;
    });

    console.log(`Extracted candidates count: ${members.length}`);
    // Remove duplicates
    const uniqueMap = new Map();
    members.forEach((m: Candidate) => uniqueMap.set(m.name, m));
    return Array.from(uniqueMap.values());
  }

  private async extractAllData(page: Page): Promise<ScrapedData> {
    const rawData = await page.evaluate(() => {
      // Collect Images for AI Context
      const images: { src: string; width: number; height: number; alt: string }[] = [];
      document.querySelectorAll('img').forEach((img) => {
        const rect = img.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          images.push({
            src: img.src,
            width: rect.width,
            height: rect.height,
            alt: img.alt || '',
          });
        }
      });

      // 1. BRANDING (Heuristic Fallback + Meta Tags)
      let logo = '';
      const logoImg = document.querySelector('header img, .logo img, img[alt*="logo" i]');
      if (logoImg) logo = logoImg.getAttribute('src') || '';
      
      // Meta tags for Logo
      if (!logo) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) logo = ogImage.getAttribute('content') || '';
      }
      if (!logo) {
        const icon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (icon) logo = icon.getAttribute('href') || '';
      }

      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const jsonLdData: any[] = [];
      jsonLdScripts.forEach((script) => {
        try {
          const parsed = JSON.parse(script.textContent || '{}');
          jsonLdData.push(parsed);
        } catch (e) {
          // invalid json
        }
      });

      // Google Maps Detection
      let mapsUrl = '';
      const mapIframe = document.querySelector('iframe[src*="google.com/maps"]');
      if (mapIframe) mapsUrl = mapIframe.getAttribute('src') || '';
      if (!mapsUrl) {
         const mapLink = document.querySelector('a[href*="google.com/maps"]');
         if (mapLink) mapsUrl = mapLink.getAttribute('href') || '';
      }

      return {
        content: document.body.innerText.substring(0, 20000), // Increased cap slightly
        businessName: document.title.split('|')[0].trim(),
        branding: {
          logo,
          colors: { primary: '#000000' }, // Will be overwritten by AI
          phone: '',
          email: '',
          hours: '',
          services: [],
        },
        team: [],
        blogPosts: [],
        faqs: [],
        imageCandidates: images, // Pass to AI
        jsonLd: jsonLdData,
        mapsUrl
      };
    });

    // 2. AI ENRICHMENT (The "Advanced" part)
    try {
      // Capture Screenshot for Vision (full page for comprehensive analysis)
      const screenshotBuffer = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 70,
        fullPage: true,
      });

      const visionModel = new ChatOpenAI({
        modelName: 'gpt-4o',
        maxTokens: 4000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are analyzing a business website. Extract EVERY piece of information visible.

1. **LOGO** (HIGHEST PRIORITY):
   - Check the Top-Left of the main image.
   - Also consider the provided JSON-LD 'logo' field or 'og:image' if visual logo is hard to find.
   - Return EXACT URL from imageCandidates below if possible.

2. **CONTACT & FOOTER INFO (CRITICAL)**:
   - **Address**: Scroll to the BOTTOM (Footer). Look for Street, City, ZIP. If a map is visible, describe the location.
   - **Hours**: Look in the Footer or 'Contact' section. Format: "L-V: 09:00-20:00". Find specific times.
   - **Phone**: Header or Footer. prefer fixed lines (+34 9...) or mobile (+34 6...).
   - **Email**: Look for mailto: links or text with @.

3. **NAVIGATION & SERVICES**:
   - List global navigation items.
   - Extract ALL services found in menus/dropdowns (e.g., "Implantes", "Ortodoncia").

4. **TEAM**:
   - Extract names from "Equipment", "Team", "Nosotros" sections.
   - Match names with images if clear.

5. **COLORS**:
   - Primary: main button color, header background.
   - Secondary: accent color.

Return ONLY valid JSON:
{
  "businessName": "string",
  "logoUrl": "string",
  "colors": { "primary": "#RRGGBB", "secondary": "#RRGGBB" },
  "navbarSections": [{ "name": "string", "items": ["item1"] }],
  "services": ["service1", "service2"],
  "team": [{ "name": "string", "role": "string", "image": "URL" }],
  "contact": { "phone": "string", "email": "string", "address": "string", "hours": "string" },
  "blog": [{ "title": "string", "url": "string" }],
   "testimonials": ["quote1"],
  "insurance": ["provider1"]
}

ADDITIONAL CONTEXT (JSON-LD & Maps):
JSON-LD: ${JSON.stringify(rawData.jsonLd || [])}
MAPS URL: ${rawData.mapsUrl || 'None'}

RAW TEXT (Footer & Main):
${rawData.content.substring(0, 5000)}
...
${rawData.content.substring(rawData.content.length - 5000)}

IMAGES:
${JSON.stringify(rawData.imageCandidates?.slice(0, 30))}
        `;

      const response = await visionModel.invoke([
        new HumanMessage({
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${screenshotBuffer}` },
            },
          ],
        }),
      ]);

      const content = response.content.toString();
      // Clean markdown code blocks if present
      const jsonStr = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const aiData = JSON.parse(jsonStr);

      this.logger.log('🤖 AI Analysis Complete');

      // Merge AI Data
      return {
        content: rawData.content,
        businessName: aiData.businessName || rawData.businessName,
        branding: {
          logo: aiData.logoUrl || rawData.branding.logo,
          colors: {
            primary: aiData.colors?.primary || '#000000',
            secondary: aiData.colors?.secondary || '#000000',
          },
          phone: aiData.contact?.phone || '',
          email: aiData.contact?.email || '',
          hours: aiData.contact?.hours || '',
          address: aiData.contact?.address || '',
          services: aiData.services || [],
          navbarSections: aiData.navbarSections || [],
          insurance: aiData.insurance || [],
        },
        team: aiData.team || [],
        blogPosts: aiData.blog || [],
        faqs: [],
        testimonials: aiData.testimonials || [],
      };
    } catch (e) {
      this.logger.warn(`AI Analysis failed, falling back to heuristics: ${e}`);
      return rawData; // Fallback to raw DOM data if AI fails
    }
  }
}
