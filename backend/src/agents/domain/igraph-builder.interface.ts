import { Runnable } from '@langchain/core/runnables';
import { WorkflowTemplate } from '../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from './agent-state.interface';

export interface IGraphBuilder {
  build(template: WorkflowTemplate): Promise<Runnable<AgentState, AgentState>>;
}
