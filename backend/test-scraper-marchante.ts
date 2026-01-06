import puppeteer from 'puppeteer';

// INLINED ADAPTER LOGIC TO BYPASS IMPORT ISSUES
class InlineScraper {
  async scrape(url: string) {
    console.log('--- INLINE SCRAPER V1 STARTING ---');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 3. Extract Members (Robust TreeWalker Approach)
      console.log('--- Extracting Team Members (Browser Context - TreeWalker) ---');

      const members = await page.evaluate(() => {
        const candidates: { name: string; role: string }[] = [];

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

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;

        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim() || '';

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

              // Specific check for Marchante Gago structure
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
      const uniqueMap = new Map<string, { name: string; role: string }>();
      members.forEach((m) => uniqueMap.set(m.name, m));
      const finalTeam = Array.from(uniqueMap.values());

      console.log('FINAL TEAM FOUND:', finalTeam);
      return finalTeam;
    } catch (e) {
      console.error(e);
    } finally {
      await browser.close();
    }
  }
}

async function run() {
  const url = 'https://marchantegago.com/equipo';
  const scraper = new InlineScraper();
  await scraper.scrape(url);
}

run();
