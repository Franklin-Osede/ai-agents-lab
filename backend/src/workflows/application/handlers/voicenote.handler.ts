import { Injectable } from '@nestjs/common';
import { NodeHandler, NodeExecutionResult, WorkflowNode } from './node-handler.interface';
import { WorkflowSession } from '../../domain/workflow-session.entity';

@Injectable()
export class VoiceNoteHandler implements NodeHandler {
  async execute(
    node: WorkflowNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _session: WorkflowSession,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _input?: unknown,
  ): Promise<NodeExecutionResult> {
    // Basic Voice Note execution:
    // 1. Return the configuration (text/voice) so the client can synthesize/play it.
    // 2. Automatically move to the next node (since it's an output node).

    // In a real implementation with streaming, this might return a stream URL.
    // For now, we return the text and metadata.
    const nextNodeId = node.connections && node.connections.length > 0 ? node.connections[0] : null;

    return {
      response: {
        type: 'voicenote',
        text: node.data?.text,
        voiceGender: node.data?.voiceGender,
        status: 'completed', // Voice note immediately 'completes' on the server side
      },
      nextNodeId,
    };
  }
}
