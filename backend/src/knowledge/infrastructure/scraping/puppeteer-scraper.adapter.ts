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
    'treatment',
    'tratamiento',
    'precio',
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
          timeout: 30000,
        }); // Changed to domcontentloaded for speed
      } catch (navError) {
        this.logger.error(`Failed to load main page ${url}: ${navError}`);
        throw new Error('Could not access the website');
      }

      const homeData = await this.extractPageData(mainPage);

      // 2. Find links but be gentle with crawling
      let combinedContent = `--- HOMEPAGE (${url}) ---\n${homeData.content}`;

      try {
        const relevantLinks = await this.findRelevantLinks(mainPage, url);
        this.logger.log(`Found ${relevantLinks.length} relevant subpages. Crawling limited set...`);

        // Limit to 3 subpages and run sequentially to avoid crashing low-resource servers
        const limit = 3;
        for (const link of relevantLinks.slice(0, limit)) {
          try {
            // Reuse the same page if possible or create new one carefully
            // We'll create a new one to be clean
            const subPage = await browser.newPage();
            await this.configurePage(subPage); // Ensure viewport match

            this.logger.debug(`Crawling subpage: ${link}`);
            await subPage.goto(link, {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            }); // Short timeout

            const subData = await this.extractPageData(subPage);
            combinedContent += `\n\n--- SUBPAGE (${subData.title}) ---\n${subData.content}`;

            await subPage.close();
          } catch (subError) {
            this.logger.warn(`Skipping subpage ${link} due to error`);
            // Continue loop
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
      };
    } catch (error) {
      this.logger.error(`Critical error scraping ${url}`, error);
      // Return a fallback instead of throwing 500 if possible, or rethrow friendly error
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
        .querySelectorAll('script, style, nav, footer, iframe, noscript, svg')
        .forEach((el) => el.remove());
    });

    const title = await page.title();
    const content = await page.evaluate(() => document.body.innerText || '');
    const rawHtml = await page.content();

    return { title, content: this.cleanContent(content), rawHtml };
  }

  private async findRelevantLinks(page: Page, baseUrl: string): Promise<string[]> {
    const hrefs = await page.evaluate(() => {
      // Browser context: select all links and return href + text
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
        // Only internal links
        if (urlObj.hostname !== baseDomain) continue;
        // Ignore noise
        if (link.href === baseUrl || link.href.includes('#')) continue;

        // Check if relevant
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
