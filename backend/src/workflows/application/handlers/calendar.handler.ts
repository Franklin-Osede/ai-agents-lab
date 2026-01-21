import { Injectable, Inject } from '@nestjs/common';
import { NodeHandler, NodeExecutionResult, WorkflowNode } from './node-handler.interface';
import { WorkflowSession } from '../../domain/workflow-session.entity';
import { IKnowledgeSourceRepository } from '../../../knowledge/domain/repositories/knowledge-source.repository';

@Injectable()
export class CalendarHandler implements NodeHandler {
  constructor(
    @Inject(IKnowledgeSourceRepository)
    private knowledgeRepository: IKnowledgeSourceRepository,
  ) {}

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

    // Otherwise, generate available slots
    let availableSlots: string[] = [];

    // 1. Try to get real schedule from KnowledgeSource
    if (session.knowledgeSourceId) {
      const source = await this.knowledgeRepository.findById(session.knowledgeSourceId);
      // Safe access to metadata.schedule
      const schedule = (source?.metadata as any)?.schedule;
      if (schedule) {
        availableSlots = this.generateSlotsFromSchedule(schedule);
      }
    }

    // 2. Fallback if no real data found
    if (availableSlots.length === 0) {
      availableSlots = this.generateMockSlots();
    }

    return {
      response: {
        type: 'calendar',
        status: 'interactive',
        provider: node.data?.provider || 'default',
        slots: availableSlots,
      },
      nextNodeId: null, // Wait for user interaction
    };
  }

  private generateSlotsFromSchedule(scheduleText: string): string[] {
    // Very simple parser for demo purposes.
    // Expects something like "Mon-Fri 9am-5pm" or just assumes 9-17 if mentions 9.
    const now = new Date();
    const slots: string[] = [];

    // Start from tomorrow
    const startDay = new Date(now);
    startDay.setDate(startDay.getDate() + 1);

    // Generate 3 days of slots
    for (let i = 0; i < 3; i++) {
      const day = new Date(startDay);
      day.setDate(day.getDate() + i);

      // Simple heuristic: If text contains '10' start at 10, else 9
      const startHour = scheduleText.includes('10') ? 10 : 9;

      // Add a couple of slots per day
      const slot1 = new Date(day);
      slot1.setHours(startHour, 0, 0, 0);

      const slot2 = new Date(day);
      slot2.setHours(startHour + 2, 30, 0, 0); // 2.5 hours later

      slots.push(slot1.toISOString());
      slots.push(slot2.toISOString());
    }

    return slots;
  }

  private generateMockSlots(): string[] {
    const now = new Date();
    const d1 = new Date(now);
    d1.setDate(d1.getDate() + 1);
    d1.setHours(10, 0, 0);

    const d2 = new Date(now);
    d2.setDate(d2.getDate() + 2);
    d2.setHours(14, 0, 0);

    return [d1.toISOString(), d2.toISOString()];
  }
}
