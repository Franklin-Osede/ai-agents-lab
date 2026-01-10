import { WorkflowSession } from '../../domain/workflow-session.entity';

export interface WorkflowNode {
  id: string;
  type: string;
  data?: any;
  connections?: string[];
}

export interface NodeExecutionResult {
  nextNodeId?: string | null; // The ID of the node to move to next
  response?: any; // The payload to send to the client (e.g. audio URL, text)
  updates?: Partial<WorkflowSession>; // State updates to apply to the session
}

export interface NodeHandler {
  execute(node: WorkflowNode, session: WorkflowSession, input?: any): Promise<NodeExecutionResult>;
}
