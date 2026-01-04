import { ContentType } from '../services/content-classifier.service';

export class KnowledgeChunk {
  id: string;
  sourceId: string;
  content: string;
  type: ContentType;
  embedding: number[]; // Vector representation
  metadata: Record<string, unknown>;

  constructor(partial: Partial<KnowledgeChunk>) {
    Object.assign(this, partial);
  }
}
