import { Injectable, Logger } from '@nestjs/common';
import { IScraperService, ScrapedPage } from '../../domain/repositories/scraping.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

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

      // 1. Scrape Main Page (Base requirement)
      this.logger.debug(`Navigating to Home: ${url}`);
      try {
        await mainPage.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        }); 
      } catch (navError) {
        this.logger.error(`Failed to load main page ${url}: ${navError}`);
        throw new Error('Could not access the website');
      }

      // 2. Extraer Branding (Antes de limpiar)
      let screenshot: string | undefined;
      let styles: { primaryColor?: string } | undefined;
      let logoUrl: string | undefined;

      try {
        // Screenshot (optimizado)
        const buffer = await mainPage.screenshot({
          type: 'jpeg',
          quality: 60,
          encoding: 'base64',
          clip: { x: 0, y: 0, width: 1280, height: 800 }, // Hero section only
        });
        screenshot = buffer as string;

        // Estilos y Logo
        const brandingData = await mainPage.evaluate(() => {
          // Find Primary Color (heuristic: background color of buttons)
          let primaryColor = '#3b82f6'; // Default blue
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
              primaryColor = bg; // Simplest: take the first valid button color
              break;
            }
          }

          // Find Logo
          let logo = '';
          const logoImg = document.querySelector('header img, .logo img, img[alt*="logo"]');
          if (logoImg) logo = logoImg.getAttribute('src') || '';

          if (!logo) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) logo = ogImage.getAttribute('content') || '';
          }

          if (!logo) {
            const linkIcon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (linkIcon) logo = linkIcon.getAttribute('href') || '';
          }

          return { primaryColor, logo };
        });

        // Resolve relative URLs for logo
        if (brandingData.logo && !brandingData.logo.startsWith('http')) {
          try {
            brandingData.logo = new URL(brandingData.logo, url).href;
          } catch (e) {
            /* ignore invalid url */
          }
        }

        styles = { primaryColor: brandingData.primaryColor };
        logoUrl = brandingData.logo;
      } catch (brandingError) {
        this.logger.warn('Error extracting branding assets', brandingError);
      }

      const homeData = await this.extractPageData(mainPage);

      // 2. Find links but be gentle with crawling
      let combinedContent = `--- HOMEPAGE (${url}) ---\n${homeData.content}`;

      try {
        const relevantLinks = await this.findRelevantLinks(mainPage, url);
        this.logger.log(`Found ${relevantLinks.length} relevant subpages. Crawling limited set...`);

        // Limit to 5 subpages and run sequentially
        const limit = 5;
        for (const link of relevantLinks.slice(0, limit)) {
          try {
            const subPage = await browser.newPage();
            await this.configurePage(subPage);

            this.logger.debug(`Crawling subpage: ${link}`);
            await subPage.goto(link, {
              waitUntil: 'domcontentloaded',
              timeout: 15000,
            });

            const subData = await this.extractPageData(subPage);
            // Limit subpage content to avoid context overflow, prioritizing top content
            const truncatedSubContent = subData.content.substring(0, 5000);
            combinedContent += `\n\n--- SUBPAGE (${subData.title}) ---\n${truncatedSubContent}`;

            await subPage.close();
          } catch (subError) {
            this.logger.warn(`Skipping subpage ${link} due to error`);
          }
        }
      } catch (crawlError) {
        this.logger.warn('Crawling process had issues, returning homepage only', crawlError);
      }

      return {
        url,
        title: homeData.title,
        content: combinedContent,
        rawHtml: homeData.rawHtml,
        screenshot,
        styles,
        logoUrl,
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
  }

  private async extractPageData(page: Page) {
    // Basic Cleanup
    await page.evaluate(() => {
      document
        .querySelectorAll('script, style, iframe, noscript, svg')
        .forEach((el) => el.remove());
    });

    const title = await page.title();
    // Get text but limit to 10k chars per page initially
    const content = await page.evaluate(() => document.body.innerText || '');
    const clean = this.cleanContent(content).substring(0, 10000);
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
}
