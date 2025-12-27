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
    // Abandoned Cart Agent
    '¡Hola! Soy tu Agente Recuperador de Carritos. Dale a continuar y podrás maximizar las ventas de usuarios que dejaron items en el carrito.',

    // Booking Agent - Restaurant
    '¡Hola! Soy tu asistente de reservas. ¿Qué te gustaría hacer hoy?',
    '¿Para cuántas personas necesitas la mesa?',
    '¿Prefieres comer o cenar?',

    // Booking Agent - Dentist
    'Clínica Dental Sonrisas. ¿En qué puedo ayudarte?',

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
    this.logger.log('🔥 Pre-generating common phrases...');
    const voices = ['Lucia', 'Sergio', 'Mia'];

    for (const voice of voices) {
      for (const phrase of this.COMMON_PHRASES) {
        try {
          await this.synthesizeSpeech(phrase, voice);
        } catch (error) {
          this.logger.warn(`Failed to pre-generate: ${phrase} (${voice})`);
        }
      }
    }

    this.logger.log(`✅ Cache warmed: ${this.audioCache.size} phrases ready`);
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

    // Enhanced SSML with natural pauses for more natural speech
    // Neural voices benefit from natural pauses - using simpler SSML for better compatibility
    let processedText = text
      // Natural pauses at punctuation (longer pauses for questions/exclamations)
      .replace(/\. /g, '.<break time="300ms"/> ')
      .replace(/\, /g, ',<break time="200ms"/> ')
      .replace(/\? /g, '?<break time="400ms"/> ')
      .replace(/\! /g, '!<break time="400ms"/> ');

    // Wrap in speak tags with prosody for natural intonation
    // Using rate="medium" only (pitch variations can cause issues with some Neural voices)
    const ssmlText = `<speak><prosody rate="medium">${processedText}</prosody></speak>`;

    const command = new SynthesizeSpeechCommand({
      Engine: Engine.NEURAL,
      OutputFormat: OutputFormat.MP3,
      SampleRate: '24000',
      Text: ssmlText,
      TextType: TextType.SSML,
      VoiceId: voiceId as VoiceId,
    });

    try {
      const response = await this.client.send(command);

      if (response.AudioStream instanceof Readable) {
        // Convert stream to buffer for caching
        const chunks: Buffer[] = [];
        for await (const chunk of response.AudioStream) {
          chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);

        // Cache for future use
        this.audioCache.set(cacheKey, audioBuffer);

        const duration = Date.now() - startTime;
        this.logger.log(
          `[Polly] ✅ Generated & cached (${duration}ms) - ${text.substring(0, 30)}...`,
        );

        // Return as readable stream
        return Readable.from(audioBuffer);
      }

      throw new Error('Invalid audio stream format returned from Polly');
    } catch (error) {
      this.logger.error('Polly Synthesis Failed', error);
      throw error;
    }
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
}
