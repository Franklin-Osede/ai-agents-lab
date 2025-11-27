import { AgentIntent } from '../entities/agent-intent.entity';

export interface IIntentClassifier {
  classify(message: string): Promise<AgentIntent>;
}
