import { Injectable } from '@nestjs/common';
import { NodeHandler, NodeExecutionResult, WorkflowNode } from './node-handler.interface';
import { WorkflowSession } from '../../domain/workflow-session.entity';

@Injectable()
export class ServiceHandler implements NodeHandler {
  async execute(
    node: WorkflowNode,
    session: WorkflowSession,
    input?: any,
  ): Promise<NodeExecutionResult> {
    if (input && input.action === 'select_service') {
      const nextNodeId =
        node.connections && node.connections.length > 0 ? node.connections[0] : null;
      return {
        response: {
          type: 'service_selector',
          status: 'selected',
          serviceId: input.serviceId,
        },
        nextNodeId,
        updates: {
          variables: {
            ...session.variables,
            selected_service: input.serviceId,
          },
        },
      };
    }

    // Mock services (In real life, fetch from DB)
    const services = [
      { id: 'srv-1', name: 'Physiotherapy Assessment', price: 60, duration: 45 },
      { id: 'srv-2', name: 'Massage Therapy', price: 50, duration: 60 },
      { id: 'srv-3', name: 'Acupuncture', price: 70, duration: 45 },
    ];

    return {
      response: {
        type: 'service_selector',
        status: 'interactive',
        services: services,
      },
      nextNodeId: null, // Wait for selection
    };
  }
}
