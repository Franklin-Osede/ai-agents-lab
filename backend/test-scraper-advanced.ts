import { PuppeteerScraperAdapter } from './src/knowledge/infrastructure/scraping/puppeteer-scraper.adapter';
import * as fs from 'fs';

async function testAdvancedScraper() {
  console.log('🚀 Testing Advanced AI Scraper with GPT-4 Vision...\n');

  const scraper = new PuppeteerScraperAdapter();

  // Test URL - using a simple accessible website for testing
  const testUrl = 'https://example.com';

  try {
    console.log(`📍 Target URL: ${testUrl}`);
    console.log('⏳ Starting scraping process...\n');

    const startTime = Date.now();
    const result = await scraper.scrapeUrl(testUrl);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Scraping completed successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 SCRAPING RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📄 Title: ${result.title}`);
    console.log(`📝 Content Length: ${result.content.length} characters`);
    console.log(`📸 Screenshot: ${result.screenshot ? 'Captured ✓' : 'Not captured ✗'}\n`);

    console.log('🎨 BRANDING:');
    console.log(`   Logo: ${result.branding?.logo || 'Not detected'}`);
    console.log(`   Primary Color: ${result.branding?.colors?.primary || 'Not detected'}`);
    console.log(`   Phone: ${result.branding?.phone || 'Not detected'}`);
    console.log(`   Email: ${result.branding?.email || 'Not detected'}`);
    console.log(`   Hours: ${result.branding?.hours || 'Not detected'}\n`);

    console.log(`🛠️  SERVICES (${result.branding?.services?.length || 0}):`);
    if (result.branding?.services && result.branding.services.length > 0) {
      result.branding.services.slice(0, 5).forEach((service, i) => {
        console.log(`   ${i + 1}. ${service}`);
      });
      if (result.branding.services.length > 5) {
        console.log(`   ... and ${result.branding.services.length - 5} more`);
      }
    } else {
      console.log('   No services detected');
    }
    console.log('');

    console.log(`👥 TEAM MEMBERS (${result.team?.length || 0}):`);
    if (result.team && result.team.length > 0) {
      result.team.slice(0, 5).forEach((member, i) => {
        console.log(`   ${i + 1}. ${member.name} - ${member.role}`);
        if (member.image) {
          console.log(`      Image: ${member.image.substring(0, 50)}...`);
        }
      });
      if (result.team.length > 5) {
        console.log(`   ... and ${result.team.length - 5} more`);
      }
    } else {
      console.log('   No team members detected');
    }
    console.log('');

    console.log(`📰 BLOG POSTS (${result.blogPosts?.length || 0}):`);
    if (result.blogPosts && result.blogPosts.length > 0) {
      result.blogPosts.slice(0, 3).forEach((post, i) => {
        console.log(`   ${i + 1}. ${post.title}`);
      });
    } else {
      console.log('   No blog posts detected');
    }
    console.log('');

    console.log(`❓ FAQs (${result.faqs?.length || 0}):`);
    if (result.faqs && result.faqs.length > 0) {
      result.faqs.slice(0, 3).forEach((faq, i) => {
        console.log(`   ${i + 1}. ${faq.question}`);
      });
    } else {
      console.log('   No FAQs detected');
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✨ AI Vision Analysis: ACTIVE');
    console.log('🎯 Status: OPTIMIZADO');
    console.log('═══════════════════════════════════════════════════\n');

    // Save detailed results to file for inspection
    const outputPath = './scraper-test-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full results saved to: ${outputPath}\n`);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testAdvancedScraper();
