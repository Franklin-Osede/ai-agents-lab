import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testScrape() {
  console.log('Starting scrape test for marchantegago.com...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    console.log('Navigating...');
    await page.goto('https://marchantegago.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    console.log('Navigation successful!');
    const title = await page.title();
    console.log('Title:', title);
    // Check key elements
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Body start:', bodyText);
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await browser.close();
  }
}

testScrape();
