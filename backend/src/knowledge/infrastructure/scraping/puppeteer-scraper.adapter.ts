import { Injectable, Logger } from '@nestjs/common';
import { IScraperService, ScrapedPage } from '../../domain/repositories/scraping.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page, HTTPRequest } from 'puppeteer';

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
    return await page.evaluate(() => {
      const getText = (selector: string) =>
        document.querySelector(selector)?.textContent?.trim() || '';
      const getAttr = (selector: string, attr: string) =>
        document.querySelector(selector)?.getAttribute(attr) || '';

      // 1. BRANDING
      let logo = '';
      const logoImg = document.querySelector('header img, .logo img, img[alt*="logo" i]');
      if (logoImg) logo = logoImg.getAttribute('src') || '';
      if (!logo) logo = getAttr('meta[property="og:image"]', 'content');
      if (!logo) logo = getAttr('link[rel="icon"]', 'href');

      let businessName = getText('h1');
      if (!businessName) businessName = document.title.split('|')[0].trim();

      // 2. CONTACT
      let phone = '';
      let email = '';
      const phoneRegex = /(?:\+34|0034)?\s*[6789](?:[\s.-]*\d){8}/;
      const telLink = document.querySelector('a[href^="tel:"]');
      if (telLink) {
        const t = telLink.textContent?.trim();
        if (t && /\d/.test(t)) phone = t;
      }
      if (!phone) {
        const footer = document.querySelector('footer, .contact-section, #contact');
        const searchCtx = footer ? (footer as HTMLElement).innerText : document.body.innerText;
        const searchArea =
          searchCtx.length > 3000 ? searchCtx.substring(searchCtx.length - 3000) : searchCtx;
        const match = searchArea.match(phoneRegex);
        if (match) phone = match[0].trim();
      }
      const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
      const mailMatch = document.body.innerText.match(emailRegex);
      if (mailMatch) email = mailMatch[0];

      // 3. SCHEDULE
      let hours = '';
      // Regex 1: Standard range (Lunes a Viernes 9-20h)
      const hoursRegexRange =
        /(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo|L|M|X|J|V|S|D|Lun|Mar|Mie|Jue|Vie|Sab|Dom|Weekdays|Monday|Friday|Sat|Sun)[\s\S]{0,20}(?:a|to|-|–)[\s\S]{0,20}\d{1,2}[:h]?\d{0,2}[\s\S]{0,10}(?:a|to|-|–)[\s\S]{0,10}\d{1,2}[:h]?\d{0,2}/i;

      // Regex 2: Simple time pattern found near "Horario"
      const timePattern = /\d{1,2}[:h]\d{2}/;

      const footer = document.querySelector('footer, .contact-section, #contact, .site-footer');
      const searchCtx = footer ? (footer as HTMLElement).innerText : document.body.innerText;

      // Optimize: only look at the last part of the page if footer not found specifically
      const searchArea =
        !footer && searchCtx.length > 3000
          ? searchCtx.substring(searchCtx.length - 3000)
          : searchCtx;

      const lines = searchArea.split('\n');
      const hoursLines = lines.filter((l) => {
        const cleanL = l.trim();
        if (cleanL.length > 100) return false;
        // Match standard range
        if (hoursRegexRange.test(cleanL)) return true;
        // Match "Horario" keyword + time pattern
        if (/horario|apertura|consulta/i.test(cleanL) && timePattern.test(cleanL)) return true;
        // Match days + time pattern (e.g. "L-V: 10:00 - 14:00")
        if (/[LMXJVSD]{1,3}(?:-[LMXJVSD]{1,3})?/i.test(cleanL) && timePattern.test(cleanL)) return true;
        return false;
      });

      if (hoursLines.length > 0) hours = hoursLines.join('\n');

      // 4. TEAM
      const team: Array<{ name: string; role: string; image: string }> = [];
      const potentialCards = document.querySelectorAll(
        '.team-member, .person, .doctor, .card, .elementor-image-box-content, .wp-block-column, .div, .elementor-column, .pp-team-member, .elementor-widget-icon-box, .et_pb_team_member, .et_pb_blurb',
      );
      potentialCards.forEach((card) => {
        const img = card.querySelector('img');
        if (!img) return;
        const imgRect = img.getBoundingClientRect();
        if (imgRect.width < 50 || imgRect.height < 50) return;
        const cardText = (card as HTMLElement).innerText;
        const cardLines = cardText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 2);
        if (cardLines.length >= 2) {
          const name = cardLines[0];
          const role = cardLines[1];
          const isName =
            /^(?:Dr\.|Dra\.|Mr\.|Mrs\.)?\s*[a-zA-ZÁÉÍÓÚÑáéíóúñ]+(?:\s+[a-zA-ZÁÉÍÓÚÑáéíóúñ]+)+$/.test(
              name,
            );
          const notForbidden = ![
            'Reserva',
            'Lee más',
            'Saber más',
            'Política',
            'Aviso',
            'Cookies',
            'Contacto',
            'Lunes',
            'Horario',
            'Dirección',
            'Clinica',
            'Fisioterapia',
            'Reservar',
            'Sesión',
            'Sesion',
          ].some((w) => name.includes(w));
          if (isName && notForbidden && name.length < 50) {
            team.push({ name, role: role.substring(0, 50), image: img.src });
          }
        }
      });

      // 5. BLOG
      const blogPosts: Array<{ title: string; url: string }> = [];
      const articles = document.querySelectorAll(
        'article, .post, .entry, .blog-item, .elementor-post',
      );
      articles.forEach((art) => {
        const link = art.querySelector('a');
        const title = art.querySelector('h2, h3, h4, .elementor-post__title')?.textContent?.trim();
        if (link && title) blogPosts.push({ title, url: link.href });
      });
      if (blogPosts.length === 0) {
        document.querySelectorAll('a').forEach((a) => {
          if (
            a.closest('.widget_recent_entries') ||
            a.closest('.news-list') ||
            a.href.includes('/noticia/') ||
            a.href.includes('/blog/')
          ) {
            const t = a.textContent?.trim();
            if (t && t.length > 10) blogPosts.push({ title: t, url: a.href });
          }
        });
      }

      // 6. SERVICES
      const servicesSet: Set<string> = new Set();

      // Strategy A: Detect dedicated "Services" or "Treatments" sections
      const serviceSectionSelectors = [
        '#servicios',
        '#tratamientos',
        '#especialidades',
        '.services',
        '.treatments',
        '.servicios',
        '.nuestros-servicios',
        '.our-services',
        'section[class*="service"]',
        'div[id*="service"]',
      ];

      serviceSectionSelectors.forEach((selector) => {
        const container = document.querySelector(selector);
        if (container) {
          container
            .querySelectorAll('h3, h4, h5, .elementor-icon-box-title, .et_pb_module_header')
            .forEach((el) => {
              const text = el.textContent?.trim();
              if (
                text &&
                text.length > 4 &&
                text.length < 60 &&
                !text.includes('€') &&
                !/\d/.test(text)
              ) {
                servicesSet.add(text);
              }
            });
        }
      });

      // Strategy B: Navigation and Keyword Match
      // Added more generic selectors for menus (wp-block-navigation, menu-item, etc.)
      const potentialLinks = document.querySelectorAll(
        'nav a, ul li a, .elementor-nav-menu a, .service-title, .h3 a, .et_pb_module_header a, .menu-item a, .sub-menu a, .dropdown-menu a, .wp-block-navigation-link__content',
      );

      const serviceKeywords = [
        'fisioterapia',
        'osteopatia',
        'masaje',
        'rehabilitacion',
        'pilates',
        'yoga',
        'entrenamiento',
        'implante',
        'ortodoncia',
        'periodoncia',
        'endodoncia',
        'dental',
        'dientes',
        'odontologia',
        'medicina',
        'consulta',
        'cardiologia',
        'dermatologia',
        'pediatria',
        'estetica',
        'cirugia',
        'tratamiento',
        'servicio',
        'terapia',
        'psicologia',
        'nutricion',
        'podologia',
        'suelo pelvico',
        'maternidad',
      ];

      potentialLinks.forEach((a) => {
        const t = a.textContent?.trim() || '';
        const href = a.getAttribute('href') || '';

        // Match by Text OR URL keyword
        const matchesKeyword = serviceKeywords.some((kw) => t.toLowerCase().includes(kw) || href.toLowerCase().includes(kw));

        if (
          t.length > 3 &&
          t.length < 60 &&
          matchesKeyword &&
          !t.toLowerCase().includes('aviso') &&
          !t.toLowerCase().includes('cookies') &&
          !t.toLowerCase().includes('politica') &&
          !t.toLowerCase().includes('contacto') &&
          !t.toLowerCase().includes('nosotros')
        ) {
          servicesSet.add(t);
        }
      });

      const services = Array.from(servicesSet);

      // 7. COLORS
      let primaryColor = '#000';
      const buttons = document.querySelectorAll(
        'button, a.btn, input[type="submit"], .btn, .elementor-button',
      );
      for (const btn of Array.from(buttons)) {
        const style = window.getComputedStyle(btn);
        const bg = style.backgroundColor;
        if (
          bg &&
          bg !== 'rgba(0, 0, 0, 0)' &&
          bg !== 'transparent' &&
          bg !== 'rgb(255, 255, 255)'
        ) {
          primaryColor = bg;
          break;
        }
      }

      return {
        content: document.body.innerText,
        businessName,
        branding: {
          logo,
          colors: { primary: primaryColor },
          phone,
          email,
          hours,
          services,
        },
        team,
        blogPosts,
        faqs: [],
      };
    });
  }
}
