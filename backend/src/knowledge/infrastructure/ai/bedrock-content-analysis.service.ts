import { Injectable, Logger } from '@nestjs/common';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';

export interface ExtractedKnowledge {
  summary: string;
  classification: {
    type: string;
    confidence: number;
    tags: string[];
  };
  branding: {
    tone: string;
    primaryColor?: string;
    logoUrl?: string;
  };
  structuredData: {
    services: Array<{ name: string; price?: string; description?: string }>;
    team: Array<{ name: string; role?: string; bio?: string }>;
    businessInfo: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      schedule?: string;
    };
  };
  dynamicSections: Array<{
    title: string;
    items: Array<{ headline: string; description?: string }>;
    type: 'list' | 'grid' | 'text';
  }>;
}

@Injectable()
export class BedrockContentAnalysisService {
  private readonly client: BedrockRuntimeClient;
  private readonly logger = new Logger(BedrockContentAnalysisService.name);

  // Use Claude 3 Haiku for speed/cost balance (AWS auto-enables on first use)
  private readonly MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

  constructor(private configService: ConfigService) {
    this.client = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async analyzeContent(text: string): Promise<ExtractedKnowledge> {
    try {
      this.logger.log(`Analyzing content with AWS Bedrock model: ${this.MODEL_ID}`);

      const truncatedText = text.substring(0, 25000);

      this.logger.debug(`Prompt length: ${truncatedText.length} chars`);

      const prompt = `
        You are an AI expert in extracting structured data into JSON from website content.
        
        Analyze the following Website Content and return a JSON object with this EXACT structure:

        {
          "summary": "Brief professional summary (max 3 sentences)",
          "classification": { "type": "Business Type", "confidence": 0-1, "tags": ["tag1"] },
          "branding": {
             "tone": "Describe the tone (e.g., Professional, Medical, Friendly, Luxury)",
             "primaryColor": "Infer a hex color code based on the business type (e.g. Blue for Medical) if not explicit"
          },
          "structuredData": {
             "services": [{ "name": "Service Name", "price": "Price or 'Consultar'", "description": "Short desc" }],
             "team": [{ "name": "Name", "role": "Role" }],
             "businessInfo": { "name": "Name", "address": "Address", "phone": "Phone", "email": "Email", "schedule": "Hours" }
          },
          "dynamicSections": [
             { 
               "title": "Section Title (e.g. 'Advanced Technology', 'Programs', 'Menu', 'Why Choose Us')", 
               "items": [{ "headline": "Item Name", "description": "Detail" }],
               "type": "list"
             }
          ]
        }

        INSTRUCTIONS:
        1. "dynamicSections": Identify UNIQUE valuable sections that are NOT services or team. Examples: "Equipment", "Methodology", "Awards", "Case Studies".
        2. "services": Extract strictly services/products offered.
        3. Do NOT include markdown code blocks (like \`\`\`json). Return ONLY valid JSON.

        WEBSITE CONTENT:
        ${truncatedText}
      `;

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId: this.MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Parse Claude's response (it's in content[0].text)
      let jsonString = responseBody.content[0].text;

      // Clean potential markdown code blocks if the model adds them despite instructions
      jsonString = jsonString
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const result = JSON.parse(jsonString);

      return result as ExtractedKnowledge;
    } catch (error: unknown) {
      const err = error as { $metadata?: unknown; name?: string; message?: string };
      this.logger.error('Error calling AWS Bedrock:', err);
      if (err.$metadata) {
        this.logger.error('AWS Metadata:', JSON.stringify(err.$metadata));
      }
      this.logger.error('Error Name:', err.name);
      this.logger.error('Error Message:', err.message);

      // Return a basic fallback so the process doesn't completely fail
      return {
        summary: text.substring(0, 300) + '...', // Fallback to raw text summary
        classification: { type: 'unknown', confidence: 0, tags: [] },
        branding: { tone: 'neutral', primaryColor: undefined }, // Use undefined to let scraping take precedence
        structuredData: {
          services: [],
          team: [],
          businessInfo: {},
        },
        dynamicSections: [],
      };
    }
  }
}
