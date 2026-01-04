import { Injectable } from '@nestjs/common';

export enum ContentType {
  SERVICE = 'service',
  PRICING = 'pricing',
  CONTACT = 'contact',
  SCHEDULE = 'schedule',
  TEAM = 'team',
  UNKNOWN = 'unknown',
}

export interface ClassifiedContent {
  type: ContentType;
  confidence: number;
  tags: string[];
}

@Injectable()
export class ContentClassifierService {
  async classify(text: string): Promise<ClassifiedContent> {
    const lower = text.toLowerCase();

    // Heuristic 1: Pricing
    if (lower.match(/precio|coste|euros|€|\$/)) {
      return {
        type: ContentType.PRICING,
        confidence: 0.8,
        tags: ['pricing'],
      };
    }

    // Heuristic 2: Service
    if (lower.match(/tratamiento|terapia|servicio|sesión|ofrecemos/)) {
      return {
        type: ContentType.SERVICE,
        confidence: 0.75,
        tags: ['service'],
      };
    }

    return {
      type: ContentType.UNKNOWN,
      confidence: 0.5,
      tags: [],
    };
  }
}
