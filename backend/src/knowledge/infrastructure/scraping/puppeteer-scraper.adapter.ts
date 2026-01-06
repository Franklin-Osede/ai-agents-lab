import { Injectable, Logger } from '@nestjs/common';
import { IScraperService, ScrapedPage } from '../../domain/repositories/scraping.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

interface BrandingData {
  logoUrl?: string;
  primaryColor?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  socialMedia?: SocialMedia;
  services?: string[];
}

@Injectable()
export class PuppeteerScraperAdapter implements IScraperService {
  private readonly logger = new Logger(PuppeteerScraperAdapter.name);
  private readonly RELEVANT_KEYWORDS = [
    'servicio',
    'services',
    'treatment',
    'tratamiento',
    'precio',
    'precios',
    'price',
    'tarifa',
    'equipo',
    'team',
    'nosotros',
    'about',
    'contact',
    'contacto',
    'staff',
    'doctor',
    'oferta',
    'programas',
  ];

  constructor() {
    puppeteer.use(StealthPlugin());
  }

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    let browser: Browser | null = null;
    try {
      this.logger.log(`Launching Puppeteer for ${url} (Robust Mode)`);

      // Launch options optimized for stability
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Handle memory issues in docker/limited envs
          '--disable-gpu',
        ],
      });

      const mainPage = await browser.newPage();
      await this.configurePage(mainPage);

      // 1. Scrape Main Page (Base requirement) WITH RETRY
      this.logger.debug(`Navigating to Home: ${url}`);
      await this.robustGoto(mainPage, url);

      // 2. Extract Complete Branding & Business Info (Phase 1)
      let screenshot: string | undefined;
      let branding: BrandingData = {};
      let team: Array<{ name: string; role: string; image: string }> = [];

      try {
        // Screenshot (full page for better preview)
        const buffer = await mainPage.screenshot({
          type: 'jpeg',
          quality: 60,
          encoding: 'base64',
          fullPage: false, // Capture viewport only for hero section
        });

        screenshot = buffer as string;
        this.logger.debug(`📸 Screenshot captured (${screenshot.length} bytes)`);

        // Extract all branding data in one evaluation
        const brandingData = await mainPage.evaluate(() => {
          // 1. LOGO
          let logo = '';
          const logoImg = document.querySelector('header img, .logo img, img[alt*="logo" i]');
          if (logoImg) logo = logoImg.getAttribute('src') || '';

          if (!logo) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) logo = ogImage.getAttribute('content') || '';
          }

          if (!logo) {
            const linkIcon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (linkIcon) logo = linkIcon.getAttribute('href') || '';
          }

          // 2. PRIMARY COLOR (from buttons, links, or CSS variables)
          let primaryColor = '#6366f1'; // Default
          const buttons = document.querySelectorAll(
            'button, a.btn, input[type="submit"], a[class*="button"], .btn, .button',
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

          // 3. BUSINESS NAME
          let businessName = '';
          const h1 = document.querySelector('h1');
          if (h1) businessName = h1.textContent?.trim() || '';

          if (!businessName) {
            const ogSiteName = document.querySelector('meta[property="og:site_name"]');
            if (ogSiteName) businessName = ogSiteName.getAttribute('content') || '';
          }

          if (!businessName) {
            businessName = document.title.split('|')[0].trim();
          }

          // 4. ADDRESS (from Schema.org or text patterns)
          let address = '';
          const schemaScript = document.querySelector('script[type="application/ld+json"]');
          if (schemaScript) {
            try {
              const schema = JSON.parse(schemaScript.textContent || '{}');
              if (schema.address) {
                if (typeof schema.address === 'string') {
                  address = schema.address;
                } else if (schema.address.streetAddress) {
                  address = `${schema.address.streetAddress}, ${schema.address.postalCode} ${schema.address.addressLocality}`;
                }
              }
            } catch (e) {
              /* ignore */
            }
          }

          // 5. PHONE (from Schema.org, links, or text patterns)
          let phone = '';
          if (schemaScript) {
            try {
              const schema = JSON.parse(schemaScript.textContent || '{}');
              phone = schema.telephone || '';
            } catch (e) {
              /* ignore */
            }
          }

          if (!phone) {
            const telLink = document.querySelector('a[href^="tel:"]');
            if (telLink) {
              phone =
                telLink.getAttribute('href')?.replace('tel:', '').replace(/\s+/g, ' ').trim() || '';
              // Also check the link text for more complete number
              if (!phone || phone.length < 9) {
                phone = telLink.textContent?.trim() || phone;
              }
            }
          }

          // Fallback: Search for phone patterns in page text
          if (!phone || phone.length < 9) {
            const bodyText = document.body.innerText;
            // Spanish phone patterns: +34 XXX XX XX XX, XXX XXX XXX, etc.
            const phonePatterns = [
              /\+34\s*\d{3}\s*\d{2}\s*\d{2}\s*\d{2}/,
              /\+34\s*\d{9}/,
              /\d{3}\s*\d{3}\s*\d{3}/,
              /\d{3}\s*\d{2}\s*\d{2}\s*\d{2}/,
            ];
            for (const pattern of phonePatterns) {
              const match = bodyText.match(pattern);
              if (match) {
                phone = match[0].trim();
                break;
              }
            }
          }

          // 6. EMAIL
          let email = '';
          const mailLink = document.querySelector('a[href^="mailto:"]');
          if (mailLink) email = mailLink.getAttribute('href')?.replace('mailto:', '') || '';

          // 7. HOURS/SCHEDULE (Enhanced with footer search)
          let hours = '';
          if (schemaScript) {
            try {
              const schema = JSON.parse(schemaScript.textContent || '{}');
              hours = schema.openingHours || '';
            } catch (e) {
              /* ignore */
            }
          }

          // Fallback: Search footer for hours
          if (!hours) {
            const footer = document.querySelector('footer');
            if (footer) {
              const footerText = footer.innerText;
              // Look for patterns in both Spanish and English
              const hoursPatterns = [
                // English patterns
                /Monday\s+to\s+Friday\s+from\s+\d{1,2}:\d{2}\s+[ap]\.m\.\s+to\s+\d{1,2}:\d{2}\s+[ap]\.m\./i,
                /Mon\.?\s*-\s*Fri\.?\s*:?\s*\d{1,2}:\d{2}\s*[ap]m?\s*-\s*\d{1,2}:\d{2}\s*[ap]m?/i,
                // Spanish patterns
                /(?:L-V|Lunes?\s*-?\s*Viernes?)[\s:]*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/i,
                /Horario[\s:]+([^\n]{10,80})/i,
                /(?:Abierto|Open)[\s:]+([^\n]{10,80})/i,
                /(?:L|Lunes|Monday)[\s-]+(?:V|Viernes|Friday)[\s:]+\d{1,2}:\d{2}[\s-]+\d{1,2}:\d{2}/i,
              ];

              for (const pattern of hoursPatterns) {
                const match = footerText.match(pattern);
                if (match) {
                  hours = match[0].trim();
                  break;
                }
              }

              // If still no match, try to find any line with "Monday" or "Lunes" and time
              if (!hours) {
                const lines = footerText.split('\n');
                for (const line of lines) {
                  const hasDay =
                    line.includes('Monday') || line.includes('Lunes') || line.includes('L-V');
                  if (hasDay && /\d{1,2}:\d{2}/.test(line)) {
                    hours = line.trim();
                    break;
                  }
                }
              }
            }
          }

          // 7.5. TEAM / PROFESSIONALS
          const team: Array<{ name: string; role: string; image: string }> = [];
          const teamSelectors = [
            '.team-member',
            '.team-person',
            '.professional',
            '.doctor-card',
            '.elementor-image-box-content', // Generic Elementor team cards
            '.wp-block-column h3', // Common for WP columns with names
            '.et_pb_team_member', // Divi theme
          ];

          // Try to find a specific team section first
          const teamSection = Array.from(document.querySelectorAll('section, div')).find((el) => {
            const text = (el as HTMLElement).innerText.toLowerCase();
            return (
              (text.includes('equipo') ||
                text.includes('team') ||
                text.includes('profesionales')) &&
              text.length < 5000
            ); // Avoid giant containers
          });

          const searchContext = teamSection || document;

          for (const selector of teamSelectors) {
            const elements = searchContext.querySelectorAll(selector);
            if (elements.length > 0) {
              elements.forEach((el) => {
                const name = (el as HTMLElement).innerText.split('\n')[0].trim();
                if (name && name.length < 40 && !name.includes('Lorem')) {
                  const img = el.closest('div')?.querySelector('img')?.src || '';
                  const role =
                    (el as HTMLElement).innerText.split('\n')[1]?.trim() || 'Especialista';

                  // Avoid duplicates
                  if (!team.find((t) => t.name === name)) {
                    team.push({ name, role, image: img });
                  }
                }
              });
              if (team.length > 0) break; // If we found team members with one selector, stop
            }
          }

          // 8. SOCIAL MEDIA
          const socialMedia: SocialMedia = {};
          const socialLinks = document.querySelectorAll(
            'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="youtube.com"]',
          );

          socialLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            if (href.includes('facebook.com')) socialMedia.facebook = href;
            if (href.includes('instagram.com')) socialMedia.instagram = href;
            if (href.includes('twitter.com')) socialMedia.twitter = href;
            if (href.includes('linkedin.com')) socialMedia.linkedin = href;
            if (href.includes('youtube.com')) socialMedia.youtube = href;
          });

          // 9. SERVICES FROM NAVBAR
          const services: string[] = [];
          const navSelectors = [
            'nav a',
            'header a',
            '.menu a',
            '.navbar a',
            '[role="navigation"] a',
          ];

          for (const selector of navSelectors) {
            const navLinks = document.querySelectorAll(selector);
            navLinks.forEach((link) => {
              const text = link.textContent?.trim() || '';
              const href = link.getAttribute('href') || '';
              // Filter out common non-service links
              const isService =
                text.length > 2 &&
                text.length < 50 &&
                !['inicio', 'home', 'contacto', 'contact', 'about', 'nosotros', 'blog'].includes(
                  text.toLowerCase(),
                ) &&
                !href.includes('#') &&
                !href.includes('facebook') &&
                !href.includes('instagram') &&
                !href.includes('twitter');
              if (isService && !services.includes(text)) {
                services.push(text);
              }
            });
            if (services.length > 0) break; // Found services, no need to check other selectors
          }

          return {
            logo,
            primaryColor,
            businessName,
            address,
            phone,
            email,
            hours,
            socialMedia,
            services,
            team,
          };
        });

        // Resolve relative URLs for logo
        if (brandingData.logo && !brandingData.logo.startsWith('http')) {
          try {
            brandingData.logo = new URL(brandingData.logo, url).href;
          } catch (e) {
            /* ignore invalid url */
          }
        }

        branding = {
          logoUrl: brandingData.logo,
          primaryColor: brandingData.primaryColor,
          businessName: brandingData.businessName,
          address: brandingData.address,
          phone: brandingData.phone,
          email: brandingData.email,
          hours: brandingData.hours,
          socialMedia: brandingData.socialMedia,
          services: brandingData.services,
        };

        team = brandingData.team || [];

        this.logger.log(`✅ Branding extracted: ${branding.businessName || 'Unknown'}`);
      } catch (brandingError) {
        this.logger.warn('Error extracting branding assets', brandingError);
      }

      const homeData = await this.extractPageData(mainPage);

      // 2. Find links but be gentle with crawling
      let combinedContent = `--- HOMEPAGE (${url}) ---\n${homeData.content}`;

      // 3. Parallel Subpage Scraping (Turbo Mode)
      try {
        const relevantLinks = await this.findRelevantLinks(mainPage, url);
        this.logger.log(
          `Found ${relevantLinks.length} subpages. Turbo crawling 3 priority pages...`,
        );

        // Limit to 3 subpages for SPEED + HOME
        const priorityLinks = relevantLinks.slice(0, 3);

        // Run in parallel
        const subPagePromises = priorityLinks.map(async (link) => {
          let page: Page | null = null;
          try {
            if (!browser) return '';
            page = await browser.newPage();
            await this.configurePage(page);
            await this.robustGoto(page, link); // Use robust goto
            const data = await this.extractPageData(page);
            await page.close();
            return `\n\n--- SUBPAGE (${data.title}) ---\n${data.content.substring(0, 5000)}`;
          } catch (e) {
            this.logger.warn(`Failed to turbo scrape ${link}`);
            if (page) await page.close().catch(() => {});
            return '';
          }
        });

        const subPagesContent = await Promise.all(subPagePromises);
        combinedContent += subPagesContent.join('');
      } catch (crawlError) {
        this.logger.warn('Crawling process had issues, returning homepage only', crawlError);
      }

      return {
        url,
        title: homeData.title,
        content: combinedContent,
        screenshot,
        branding, // Complete branding object with all Phase 1 data
        team, // Phase 3: Team extraction
      };
    } catch (error) {
      this.logger.error(`Critical error scraping ${url}`, error);
      throw new Error(`Scraping failed: ${(error as Error).message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          /* ignore close errors */
        }
      }
    }
  }

  private async configurePage(page: Page) {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    // Resource Blocking (Turbo Mode)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  private async extractPageData(page: Page) {
    // Basic Cleanup
    await page.evaluate(() => {
      document
        .querySelectorAll('script, style, iframe, noscript, svg')
        .forEach((el) => el.remove());
    });

    const title = await page.title();

    // Extract Schema.org JSON-LD
    const jsonLd = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      return scripts.map((s) => s.innerHTML).join('\n---\n');
    });

    // Get text but limit to 10k chars per page initially
    const content = await page.evaluate(() => document.body.innerText || '');
    let clean = this.cleanContent(content).substring(0, 10000);

    // Inject Schema info into content for AI
    if (jsonLd) {
      clean = `--- DETECTED SCHEMA.ORG DATA ---\n${jsonLd}\n--- END SCHEMA ---\n\n${clean}`;
    }

    const rawHtml = await page.content();

    return { title, content: clean, rawHtml };
  }

  private async findRelevantLinks(page: Page, baseUrl: string): Promise<string[]> {
    const hrefs = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map((a) => ({ href: a.href, text: a.innerText.toLowerCase() }))
        .filter((link) => link.href && link.href.startsWith('http'));
    });

    const uniqueLinks = new Set<string>();
    const baseDomain = new URL(baseUrl).hostname;

    for (const link of hrefs) {
      try {
        const urlObj = new URL(link.href);
        if (urlObj.hostname !== baseDomain) continue;
        if (link.href === baseUrl || link.href.includes('#')) continue;

        const keywordMatcher = (kw: string) =>
          link.text.includes(kw) || link.href.toLowerCase().includes(kw);

        if (this.RELEVANT_KEYWORDS.some(keywordMatcher)) {
          uniqueLinks.add(link.href);
        }
      } catch (e) {
        continue;
      }
    }
    return Array.from(uniqueLinks);
  }

  private cleanContent(text: string): string {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  // Robust Navigation with Retries
  private async robustGoto(page: Page, url: string, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle2', // Wait for network to settle
          timeout: 30000,
        });
        return;
      } catch (e) {
        if (i === retries) {
          throw new Error('Could not access the website');
        }
        this.logger.warn(`Retrying navigation to ${url} (Attempt ${i + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
}
