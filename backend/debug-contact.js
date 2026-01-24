const axios = require('axios');
const { ChatOpenAI } = require("@langchain/openai");
require('dotenv').config();

async function testScraper() {
    const url = 'https://www.dentalnavarro.com';
    console.log(`🚀 Scraping ${url}...`);

    try {
        // 1. Fetch Home
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        let html = response.data;
        console.log(`✅ Home fetched (${html.length} chars)`);

        // 2. Smart Contact Fetch Logic (Exact copy from service)
        const contactLinkMatch = html.match(/<a[^>]+href=["']([^"']*(?:contacto|contact)[^"']*)["'][^>]*>/i);
        
        if (contactLinkMatch) {
            console.log(`🔎 Match found: ${contactLinkMatch[0]}`);
            let contactUrl = contactLinkMatch[1];
            
            // Fix relative URLs
            if (!contactUrl.startsWith('http')) {
                if (contactUrl.startsWith('/')) {
                    const u = new URL(url);
                    contactUrl = `${u.protocol}//${u.host}${contactUrl}`;
                } else {
                    contactUrl = new URL(contactUrl, url).href;
                }
            }
            
            console.log(`🔎 Contact URL detected: ${contactUrl}`);

            try {
                const contactResponse = await axios.get(contactUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 5000
                });
                const contactHtml = contactResponse.data;
                html += `\n\n<!-- CONTENIDO DE PÁGINA DE CONTACTO -->\n` + contactHtml;
                console.log(`✅ Contact page merged (${contactHtml.length} chars). Total: ${html.length}`);
            } catch (e) {
                console.log(`⚠️ Failed to fetch contact page: ${e.message}`);
            }
        } else {
            console.log('⚠️ No contact link found with current regex');
        }

        // 3. Test GPT-4 Extraction
        const openai = new ChatOpenAI({
            modelName: 'gpt-4-turbo',
            temperature: 0.1,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const htmlChunk = html.substring(0, 40000);
        console.log(`🤖 Sending ${htmlChunk.length} chars to GPT-4...`);

        const prompt = `Analiza este HTML de una página web de negocio y extrae información estructurada.

URL: ${url}

HTML (primeros 40000 caracteres, incluye header Y footer):
${htmlChunk}

Extrae la siguiente información y devuelve SOLO JSON válido:

{
  "contact": {
    "phone": "Teléfono completo",
    "email": "Email",
    "address": "Dirección completa"
  }
}`;

        const result = await openai.invoke([{ role: 'user', content: prompt }]);
        console.log('\n🤖 GPT-4 Response:\n', result.content);

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testScraper();
