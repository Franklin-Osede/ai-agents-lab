const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require("@langchain/openai");

// 1. Load Env Vars manually
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim().replace(/['"]/g, '');
                }
            });
            console.log("✅ .env loaded");
        } else {
            console.log("⚠️ .env not found at", envPath);
        }
    } catch (e) {
        console.error("❌ Error loading .env", e);
    }
}

loadEnv();

async function runDebug() {
    const url = 'https://www.dentalnavarro.com';
    console.log(`\n🚀 DEBUGGING SCRAPER for: ${url}\n`);

    try {
        // --- FETCH HOME ---
        console.log("1️⃣ Fetching Home...");
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        let html = response.data;
        console.log(`   Size: ${html.length} chars`);

        // --- CHECK CONTACT LINK ---
        console.log("\n2️⃣ Checking Contact Link...");
        const contactLinkPattern = /<a[^>]+href=["']([^"']*)["'][^>]*>(?:(?!(?:<\/a>)).)*(?:contacto|contact|donde estamos)(?:(?!(?:<\/a>)).)*<\/a>|<a[^>]+href=["']([^"']*(?:contacto|contact)[^"']*)["'][^>]*>/i;
        const contactMatch = html.match(contactLinkPattern);
        
        let contactHtmlContent = '';
        if (contactMatch) {
            let contactUrl = contactMatch[1] || contactMatch[2];
            console.log(`   ✅ Match found in HTML! URL part: ${contactUrl}`);
            
            if (contactUrl && !contactUrl.startsWith('http')) {
                contactUrl = new URL(contactUrl, url).href;
            }
            console.log(`   🔗 Full Contact URL: ${contactUrl}`);

            if (contactUrl) {
                try {
                    const cRes = await axios.get(contactUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 ...' }
                    });
                    contactHtmlContent = cRes.data;
                    console.log(`   ✅ Contact Page Fetched! Size: ${contactHtmlContent.length} chars`);
                } catch (e) {
                    console.error(`   ❌ Failed to fetch contact page: ${e.message}`);
                }
            }
        } else {
            console.log("   ❌ No contact link found with Regex.");
        }

        // --- CHECK JSON-LD ---
        console.log("\n3️⃣ Checking JSON-LD...");
        // More robust regex
        const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        const jsonLdMatches = [...html.matchAll(jsonLdRegex)];
        
        let jsonLdContent = '';
        if (jsonLdMatches.length > 0) {
            console.log(`   ✅ Found ${jsonLdMatches.length} JSON-LD blocks.`);
            jsonLdContent = jsonLdMatches.map(m => m[1]).join('\n\n');
            // Log first 200 chars to verify
            console.log(`   🔎 Preview JSON-LD: ${jsonLdContent.substring(0, 200)}...`);
        } else {
            console.log("   ❌ No JSON-LD found with Regex.");
        }

        // --- MOCK GPT REQUEST ---
        console.log("\n4️⃣ Preparing GPT Context...");
        let finalContext = html.substring(0, 40000); // Limit home
        if (contactHtmlContent) {
            finalContext += `\n\n=== CONTACT PAGE ===\n${contactHtmlContent.substring(0, 15000)}`;
        }
        if (jsonLdContent) {
            finalContext += `\n\n=== JSON-LD ===\n${jsonLdContent}`;
        }

        console.log(`   📦 Final Context Size: ${finalContext.length} chars`);
        
        // Uncomment to actually call GPT-4 if key exists
        if (process.env.OPENAI_API_KEY) {
             console.log("\n5️⃣ Calling GPT-4 (Test)...");
             const openai = new ChatOpenAI({
                 modelName: 'gpt-4-turbo',
                 temperature: 0.1,
                 openAIApiKey: process.env.OPENAI_API_KEY,
             });
             
             const prompt = `Extract contact info (phone, email, address) as JSON from this:\n\n${finalContext.substring(0, 50000)}...`; // Send a chunk
             const res = await openai.invoke([{ role: 'user', content: prompt }]);
             console.log("\n🤖 GPT Response:\n", res.content);
        } else {
            console.log("\n⚠️ Scipping GPT call (No API KEY found)");
        }

    } catch (e) {
        console.error("\n💥 FATAL ERROR:", e);
    }
}

runDebug();
