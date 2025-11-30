export interface IAiProvider {
  generateResponse(prompt: string, context?: Record<string, any>): Promise<string>;
  classifyIntent(
    message: string,
    intents: string[],
  ): Promise<{ intent: string; confidence: number }>;
}

// Injection token for IAiProvider
export const AI_PROVIDER_TOKEN = Symbol('IAiProvider');
