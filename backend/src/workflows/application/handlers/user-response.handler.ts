import { Injectable } from '@nestjs/common';
import { NodeHandler, NodeExecutionResult, WorkflowNode } from './node-handler.interface';
import { WorkflowSession } from '../../domain/workflow-session.entity';

@Injectable()
export class UserResponseHandler implements NodeHandler {
  async execute(
    node: WorkflowNode,
    session: WorkflowSession,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    // Basic User Response logic:
    // If we have input, we process it and move to the next node?
    // Or do we just wait?

    if (input && input.text) {
      // Logic to analyze text, maybe extract variables, etc.
      // Example simple branching:
      // if node.data.branches contains keywords, check input.text

      const hasConnections = node.connections && node.connections.length > 0;
      const nextNodeId = hasConnections && node.connections ? node.connections[0] : null;

      return {
        response: {
          type: 'userresponse',
          status: 'processed',
          recognizedText: input.text, // Echo back what we understood
        },
        nextNodeId,
        updates: {
          // Store the response in variables
          variables: {
            ...session.variables,
            [`last_response_${node.id}`]: input.text,
          },
          history: [
            ...session.history,
            {
              nodeId: node.id,
              type: 'user_input',
              content: input.text,
              timestamp: new Date(),
            },
          ],
        },
      };
    }

    // If no input, we are "waiting".
    // We return state "waiting" so the client knows to listen.
    return {
      response: {
        type: 'userresponse',
        status: 'waiting_for_input',
        chips: node.data?.chips || [],
      },
      nextNodeId: null, // Do not advance yet
    };
  }
}
