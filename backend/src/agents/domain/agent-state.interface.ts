import { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
  messages: BaseMessage[];
  context: Record<string, any>;
  currentNodeId: string;
  isPaused: boolean;
  [key: string]: any;
}
