import { PuppeteerScraperAdapter } from './src/knowledge/infrastructure/scraping/puppeteer-scraper.adapter';

async function testScraper() {
  console.log('Starting scraper test...');
  const scraper = new PuppeteerScraperAdapter();
  try {
    const result = await scraper.scrapeUrl('https://example.com');
    console.log('Scraping successful!');
    console.log('Title:', result.title);
    console.log('Content length:', result.content.length);
    console.log('Content preview:', result.content.substring(0, 100));
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

testScraper();
