import { Injectable } from '@nestjs/common';
import { NodeHandler, NodeExecutionResult, WorkflowNode } from './node-handler.interface';
import { WorkflowSession } from '../../domain/workflow-session.entity';

@Injectable()
export class CalendarHandler implements NodeHandler {
  async execute(
    node: WorkflowNode,
    session: WorkflowSession,
    input?: any,
  ): Promise<NodeExecutionResult> {
    // If we received a booking confirmation
    if (input && input.action === 'book_slot') {
      const nextNodeId =
        node.connections && node.connections.length > 0 ? node.connections[0] : null;
      return {
        response: {
          type: 'calendar',
          status: 'booked',
          slot: input.slot,
        },
        nextNodeId,
        updates: {
          variables: {
            ...session.variables,
            appointment_time: input.slot,
          },
        },
      };
    }

    // Otherwise, show the calendar
    // In a real app, this would fetch real availability from an external provider (Google/Outlook/DrChrono)
    const mockSlots = ['2024-01-20T10:00:00Z', '2024-01-20T11:00:00Z', '2024-01-21T14:30:00Z'];

    return {
      response: {
        type: 'calendar',
        status: 'interactive',
        provider: node.data?.provider || 'default',
        slots: mockSlots,
      },
      nextNodeId: null, // Wait for user interaction
    };
  }
}
