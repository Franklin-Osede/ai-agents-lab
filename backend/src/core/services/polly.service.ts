import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PollyClient,
  SynthesizeSpeechCommand,
  OutputFormat,
  TextType,
  Engine,
  VoiceId,
} from '@aws-sdk/client-polly';
import { Readable } from 'stream';

@Injectable()
export class PollyService implements OnModuleInit {
  private readonly logger = new Logger(PollyService.name);
  private readonly client: PollyClient;

  // In-memory cache for instant playback
  private audioCache = new Map<string, Buffer>();

  // ALL possible phrases from all agents (for 100% cache coverage)
  private readonly COMMON_PHRASES = [
    // 1. Rider Agent - Welcome (Critical for low latency)
    'Hola, bienvenido a Rider Agent. Escríbenos tu nombre y continúa con el pedido.',

    // 2. Abandoned Cart Agent
    '¡Hola! Soy tu Agente Recuperador de Carritos. Dale a continuar y podrás maximizar las ventas de usuarios que dejaron items en el carrito.',

    // 3. Booking Agent - Restaurant
    '¡Hola! Soy tu asistente de reservas. ¿Qué te gustaría hacer hoy?',

    // 4. Booking Agent - Dentist
    'Clínica Dental Sonrisas. ¿En qué puedo ayudarte?',

    '¿Para cuántas personas necesitas la mesa?',
    '¿Prefieres comer o cenar?',

    // Booking Agent - Medical
    'Consulta Médica. ¿Tienen disponibilidad esta semana? (Simulado)',
    'Consulta Médica. ¿En qué puedo ayudarte?',

    // Booking Agent - Clinic
    'Bienvenido a la Clínica. ¿En qué podemos ayudarte?',

    // Rider Agent - Common responses (AI generates dynamic text, but these are frequent)
    'Hola, bienvenido a nuestro restaurante',
    '¿En qué puedo ayudarte?',
    'Perfecto, añadido al carrito',
    '¿Algo más?',
    'Procesando tu pedido',
    'Tu pedido está listo',
    'Gracias por tu compra',
    '¿Deseas algo de beber?',
    '¿Quieres postre?',
    'Excelente elección',
    '¿Deseas agregar algo más?',
    'Entendido',
    'De acuerdo',
    'Claro',
    'Por supuesto',
  ];

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    this.client = new PollyClient({
      region,
      // Credentials loaded from env/IAM role
    });
  }

  /**
   * Pre-generate common phrases on app startup
   */
  async onModuleInit() {
    this.logger.log('🔥 PollyService Initializing with Enhanced Voice Support (Enrique/Sergio)...');

    // SMART WARMING: Only pre-generate the first 4 phrases (Greetings + Rider) to avoid AWS Throttling in Dev
    const essentialPhrases = this.COMMON_PHRASES.slice(0, 4);
    const voices = ['Sergio', 'Enrique', 'Lucia']; // Prioritize our active voices

    this.logger.log(
      `🔥 Smart Warming: Pre-generating ${essentialPhrases.length * voices.length} essential greetings...`,
    );

    for (const voice of voices) {
      for (const phrase of essentialPhrases) {
        try {
          // Add a tiny delay to be gentle with AWS API
          await new Promise((r) => setTimeout(r, 50));
          await this.synthesizeSpeech(phrase, voice);
        } catch (error) {
          // Silent fail only for warming - don't crash app
          this.logger.warn(`Warm-up skipped for: ${phrase.substring(0, 10)}...`);
        }
      }
    }

    this.logger.log(`✅ Smart Cache Ready: Greetings for ${voices.join(', ')} pre-loaded.`);
  }

  async synthesizeSpeech(text: string, voiceId: string = 'Lucia'): Promise<Readable> {
    const startTime = Date.now();

    // Create cache key
    const cacheKey = `${voiceId}:${text}`;

    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      const duration = Date.now() - startTime;
      this.logger.log(`[Polly] ⚡ CACHE HIT (${duration}ms) - ${text.substring(0, 30)}...`);

      const cachedBuffer = this.audioCache.get(cacheKey)!;
      return Readable.from(cachedBuffer);
    }

    // Cache miss - generate from Polly
    this.logger.log(`[Polly] 🔄 Generating speech for: ${voiceId}`);

    // Advanced SSML processing for natural speech
    const ssmlText = this.enhanceTextWithSSML(text, voiceId);

    try {
      return await this.executePollyCommand(ssmlText, voiceId, cacheKey, startTime);
    } catch (error) {
      this.logger.warn(
        `[Polly] ⚠️ Advanced SSML failed for ${voiceId}, retrying with basic SSML...`,
      );

      // FALLBACK: Basic SSML (just wrapping in speak tag)
      // This solves issues with voices like Sergio that might not support breathing/prosody fully
      const basicSsml = `<speak>${text}</speak>`;
      try {
        return await this.executePollyCommand(basicSsml, voiceId, cacheKey, startTime);
      } catch (retryError) {
        this.logger.error('Polly Synthesis Failed (even with fallback)', retryError);
        throw retryError;
      }
    }
  }

  private async executePollyCommand(
    text: string,
    voiceId: string,
    cacheKey: string,
    startTime: number,
  ): Promise<Readable> {
    // Determine Engine based on Voice.
    // Neural voices: Lucia, Mia, Sergio, Lupe.
    // Standard only: Enrique, Conchita.
    const standardVoices = ['Enrique', 'Conchita', 'Miguel', 'Penelope'];
    const engine = standardVoices.includes(voiceId) ? Engine.STANDARD : Engine.NEURAL;

    const command = new SynthesizeSpeechCommand({
      Engine: engine,
      OutputFormat: OutputFormat.MP3,
      SampleRate: '24000',
      Text: text,
      TextType: TextType.SSML,
      VoiceId: voiceId as VoiceId,
    });

    try {
      const response = await this.client.send(command);

      if (response.AudioStream instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of response.AudioStream) {
          chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);

        this.audioCache.set(cacheKey, audioBuffer);
        const duration = Date.now() - startTime;
        this.logger.log(
          `[Polly] ✅ Generated & cached (${duration}ms) [${engine}] - ${text.substring(0, 30)}...`,
        );

        return Readable.from(audioBuffer);
      }
    } catch (error) {
      // Voice Fallback logic
      if (voiceId === 'Enrique') {
        this.logger.warn(
          `[Polly] ⚠️ Voice 'Enrique' failed, falling back to 'Sergio' (Male Neural)`,
        );
        return this.executePollyCommand(text, 'Sergio', cacheKey, startTime);
      }
      throw error;
    }

    throw new Error('Invalid audio stream format returned from Polly');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.audioCache.size,
      phrases: Array.from(this.audioCache.keys()).map((k) => k.split(':')[1]),
    };
  }

  /**
   * Enhance text with SSML for more natural speech
   * Adds breathing, emphasis, pauses, and prosody
   */

  private enhanceTextWithSSML(text: string, voiceId: string = 'Lucia'): string {
    let enhanced = text;

    // 1. Add natural breathing at the start of greetings (Supported by Neural)
    // Only for Neural voices usually, but Standard ignores amazon:breath gracefully or we can exclude
    if (enhanced.match(/^(¡Hola|Hola|Buenos días|Buenas tardes|Bienvenid)/i)) {
      enhanced = `<amazon:breath duration="short" volume="x-soft"/>${enhanced}`;
    }

    // 2. Emphasis removed to avoid "Unsupported Neural feature" errors

    // 3. Reduce pause after exclamations at start
    enhanced = enhanced.replace(/^(¡[^!]+!)\s+/, '$1<break time="150ms"/> ');

    // 4. Natural pauses at punctuation
    enhanced = enhanced
      .replace(/,\s+/g, ',<break time="180ms"/> ')
      .replace(/\.\s+(?!$)/g, '.<break time="250ms"/> ')
      .replace(/\?\s+/g, '?<break time="350ms"/> ')
      .replace(/(?<!^¡[^!]+)!\s+/g, '!<break time="300ms"/> ');

    // 5. Pitch distinctiveness
    // If Enrique (Standard), use 'low' pitch to sound different/more senior than Sergio
    let pitch = 'default';
    if (voiceId === 'Enrique') {
      pitch = 'low';
    }

    // 6. Use standard rate tags + pitch
    if (pitch === 'default') {
      enhanced = `<prosody rate="medium">${enhanced}</prosody>`;
    } else {
      enhanced = `<prosody rate="medium" pitch="${pitch}">${enhanced}</prosody>`;
    }

    // 7. Wrap in speak tag
    return `<speak>${enhanced}</speak>`;
  }
}
