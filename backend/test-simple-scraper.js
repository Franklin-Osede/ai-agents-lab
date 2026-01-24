// Test scraper with detailed logging
import { SimpleScraperService } from './src/knowledge/infrastructure/scraping/simple-scraper.service';

async function testScraper() {
  const scraper = new SimpleScraperService();
  
  console.log('🧪 Testing scraper with dentalnavarro.com...\n');
  
  try {
    const result = await scraper.scrapeUrl('https://www.dentalnavarro.com');
    
    console.log('✅ Scraping completed!\n');
    console.log('📊 RESULTS:\n');
    console.log('Business Name:', result.branding.businessName);
    console.log('Logo:', result.branding.logo);
    console.log('\n📞 CONTACT INFO:');
    console.log('  Phone:', result.branding.phone || '❌ NOT FOUND');
    console.log('  Email:', result.branding.email || '❌ NOT FOUND');
    console.log('  Address:', result.branding.address || '❌ NOT FOUND');
    console.log('  Hours:', result.branding.hours || '❌ NOT FOUND');
    console.log('\n🏥 SERVICES:', result.branding.services?.length || 0);
    result.branding.services?.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
    console.log('\n👥 TEAM:', result.team?.length || 0);
    result.team?.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} - ${m.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testScraper();
