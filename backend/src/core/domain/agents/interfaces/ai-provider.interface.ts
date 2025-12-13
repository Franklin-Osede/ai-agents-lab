export interface IAiProvider {
  generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string>;
  classifyIntent(
    message: string,
    intents: string[],
  ): Promise<{ intent: string; confidence: number }>;
  
  // Audio capabilities (Speech-to-Text and Text-to-Speech)
  transcribeAudio(fileBuffer: Buffer): Promise<string>;
  generateAudio(text: string): Promise<Buffer>;
}

// Injection token for IAiProvider
export const AI_PROVIDER_TOKEN = Symbol('IAiProvider');
