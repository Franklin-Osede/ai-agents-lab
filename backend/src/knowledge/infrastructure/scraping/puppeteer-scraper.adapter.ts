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

interface FaqItem {
  question: string;
  answer: string;
}

interface ScrapedData {
  content: string;
  businessName: string;
  branding: {
    logo: string;
    colors: { primary: string };
    phone: string;
    email: string;
    hours: string;
    services: string[];
  };
  team: TeamMember[];
  blogPosts: BlogPost[];
  faqs: FaqItem[];
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

      // 1. EXTRACT DATA FROM HOME
      const homeData = await this.extractAllData(mainPage);
      let screenshot: string | undefined;

      try {
        const buffer = await mainPage.screenshot({
          type: 'jpeg',
          quality: 60,
          encoding: 'base64',
          fullPage: false,
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

      // 4. MERGE DATA
      const mergedBranding = { ...homeData.branding };
      const mergedTeam: TeamMember[] = [...(homeData.team || [])];
      const mergedBlog: BlogPost[] = [...(homeData.blogPosts || [])];
      const mergedFaqs: FaqItem[] = [...(homeData.faqs || [])];

      subPageResults.forEach((res) => {
        if (!res) return;

        // Use explicit type assertion for safety if needed,
        // though return type of extractAllData should propagate.
        const data = res.data;

        // Merge Team
        data.team?.forEach((member) => {
          if (!mergedTeam.find((m) => m.name === member.name)) {
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

        // Branding
        if (!mergedBranding.phone && data.branding?.phone) {
          mergedBranding.phone = data.branding.phone;
        }
        if (!mergedBranding.hours && data.branding?.hours) {
          mergedBranding.hours = data.branding.hours;
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
      // Allow fonts and styles for better rendering if needed, but blocking images is usually fine for text scraping.
      // Keeping it strict for speed, but ensuring we don't block critical scripts if they were dynamic.
      if (['image', 'media'].includes(req.resourceType())) {
        void req.abort();
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
      const keywords = [
        'equipo',
        'team',
        'doctores',
        'staff',
        'blog',
        'noticias',
        'news',
        'contacto',
        'contact',
        'nosotros',
        'about',
        'ourteam',
        'profesionales',
        'especialistas',
      ];
      const anchors = Array.from(document.querySelectorAll('a'));
      const relevant = new Set<string>();

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:'))
          return;

        const fullUrl = new URL(href, url).href;
        if (!fullUrl.startsWith(url)) return;

        const text = a.textContent?.toLowerCase() || '';
        const urlLower = fullUrl.toLowerCase();

        if (keywords.some((k) => text.includes(k) || urlLower.includes(k))) {
          relevant.add(fullUrl);
        }
      });
      return Array.from(relevant).slice(0, 10);
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

      // 1. BRANDING (Heuristic Fallback)
      let logo = '';
      const logoImg = document.querySelector('header img, .logo img, img[alt*="logo" i]');
      if (logoImg) logo = logoImg.getAttribute('src') || '';

      return {
        content: document.body.innerText.substring(0, 15000), // Cap length for token limits
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
      };
    });

    // 2. AI ENRICHMENT (The "Advanced" part)
    try {
      // Capture Screenshot for Vision
      const screenshotBuffer = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 60,
        fullPage: false,
      });

      const visionModel = new ChatOpenAI({
        modelName: 'gpt-4o',
        maxTokens: 1000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
        Analyze this business website screenshot and the raw text content provided below.
        Extract the following structured data:
        1. **Business Name**: The official name.
        2. **Tagline**: Short value proposition.
        3. **Branding**: 
            - Primary Color (Hex code seen in buttons/headers).
            - Secondary Color.
            - Logo URL: Look at the screenshot and the list of 'imageCandidates'. Pick the valid URL that corresponds to the logo in the top-left/center.
        4. **Services**: List of specific services offered.
        5. **Team**: List of team members visible or mentioned (Name, Role). Match them with a photo URL from 'imageCandidates' if possible (photos usually resemble portraits).
        6. **Contact**: Phone, Email, Address, Hours.

        Return ONLY a JSON object with this structure:
        {
            "businessName": string,
            "colors": { "primary": string, "secondary": string },
            "logoUrl": string,
            "services": string[], // Name of services
            "team": [{ "name": string, "role": string, "image": string }],
            "contact": { "phone": string, "email": string, "address": string, "hours": string }
        }

        RAW CONTENT:
        ${rawData.content.substring(0, 2000)}...

        IMAGE CANDIDATES (Use these URLs to fill logo/team images):
        ${JSON.stringify(rawData.imageCandidates?.slice(0, 20))}
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
          colors: { primary: aiData.colors?.primary || '#000000', ...aiData.colors },
          phone: aiData.contact?.phone || '',
          email: aiData.contact?.email || '',
          hours: aiData.contact?.hours || '',
          services: aiData.services || [],
        },
        team: aiData.team || [],
        blogPosts: [], // AI usually ignores blog details in this overview
        faqs: [],
      };
    } catch (e) {
      this.logger.warn(`AI Analysis failed, falling back to heuristics: ${e}`);
      return rawData; // Fallback to raw DOM data if AI fails
    }
  }
}
