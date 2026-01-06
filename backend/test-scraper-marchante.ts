import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

import { PuppeteerScraperAdapter } from './src/knowledge/infrastructure/scraping/puppeteer-scraper.adapter';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scraper = app.get(PuppeteerScraperAdapter);

  const url = 'https://marchantegago.com';
  console.log(`--- STARTING SCRAPE of ${url} ---`);
  try {
    const data = await scraper.scrapeUrl(url);

    console.log('--- BRANDING ---');
    console.log(JSON.stringify(data.branding, null, 2));

    console.log('--- TEAM ---');
    console.log(JSON.stringify(data.team, null, 2));

    console.log('--- BLOG POSTS ---');
    console.log(JSON.stringify(data.blogPosts, null, 2));

    console.log('--- FAQS ---');
    console.log(JSON.stringify(data.faqs, null, 2));

    console.log('--- RAW FOOTER TEXT PREVIEW ---');
    // Just peek at the last 2000 chars of content to see if hours match
    console.log(data.content.slice(-2000));
  } catch (e) {
    console.error(e);
  } finally {
    await app.close();
  }
}

run();
