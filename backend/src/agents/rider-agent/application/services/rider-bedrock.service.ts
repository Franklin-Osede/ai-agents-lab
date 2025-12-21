import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiInterpretationDto, AiIntent } from '../../presentation/dtos/rider-response.dto';

// AWS SDK v3 imports
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

@Injectable()
export class RiderBedrockService {
  private readonly logger = new Logger(RiderBedrockService.name);
  private readonly client: BedrockRuntimeClient;

  constructor(private configService: ConfigService) {
    // Determine region (default to us-east-1 for Bedrock availability)
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    this.client = new BedrockRuntimeClient({
      region,
      // Credentials are auto-loaded from environment variables or IAM Role (Fargate)
    });
  }

  /**
   * Transforms natural language (Voice Transcript) into Structured Food/Booking Request
   */
  async extractRideIntent(transcript: string): Promise<AiInterpretationDto> {
    this.logger.log(`Analyzing intent for: "${transcript}"`);

    // 1. Construct the Prompt - RIDA Agent (Food & Booking Focus)
    const prompt = `
      Human: You are RIDA, a smart Food Delivery & Restaurant Booking AI. Extract structured data from this user request.
      
      User Request: "${transcript}"
      
      Rules:
        You are an AI assistant for a SuperApp. Your job is to extract structured information from the user's voice transcript.
        
        Output JSON only. No markdown. No thinking.
        
        Structure:
        {
          "pickup": "Restaurant Name or null",
          "dropoff": "Delivery Address or null",
          "order_items": [ { "item": "name", "quantity": 1, "notes": "..." } ],
          "booking_details": { "party_size": 2, "time": "19:00" },
          "search_term": "Cuisine or Food Type to search for (e.g., Italian, Sushi, Burger)",
          "intent": "ride_request" | "delivery_request" | "booking_request" | "search_request" | "status_check" | "cancel_ride" | "unknown"
        }

        Examples:
        "I want a ride to Central Park" -> { "pickup": null, "dropoff": "Central Park", "intent": "ride_request" }
        "Order 2 burgers from Burger King to 123 Main St" -> { "pickup": "Burger King", "dropoff": "123 Main St", "order_items": [{ "item": "burger", "quantity": 2 }], "intent": "delivery_request" }
        "Book a table for 2 at 7pm at Bella Pizza" -> { "pickup": "Bella Pizza", "booking_details": { "party_size": 2, "time": "19:00" }, "intent": "booking_request" }
        "I want eating sushi" -> { "search_term": "sushi", "intent": "search_request" }
        "Show me italian restaurants" -> { "search_term": "italian", "intent": "search_request" }
        "I am craving a burger" -> { "search_term": "burger", "intent": "search_request" }
        "Vegetarian food please" -> { "search_term": "vegetarian", "intent": "search_request" }

        Transcript: "${transcript}"
      `;

    // 2. Prepare payload for Claude 3 Haiku
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 400,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    };

    // 3. Call Bedrock
    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);

      // 4. Parse Response
      const decodedBody = new TextDecoder().decode(response.body);
      const bedrockBody = JSON.parse(decodedBody);
      const aiText = bedrockBody.content[0].text;

      // Clean up markdown code blocks if present (Claude sometimes adds them)
      const cleanJson = aiText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Bedrock Call Failed', error);
      // Fallback intent
      return {
        pickup: undefined,
        dropoff: undefined,
        intent: AiIntent.UNKNOWN,
        order_items: [],
        booking_details: [],
      };
    }
  }
}
