import { Test, TestingModule } from '@nestjs/testing';
import { LangGraphBuilder } from './langgraph-builder.service';
import { WorkflowTemplate } from '../../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from '../../domain/agent-state.interface';
import { HumanMessage } from '@langchain/core/messages';

describe('Cycle 2: Context & Branching Integration', () => {
  let builder: LangGraphBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LangGraphBuilder],
    }).compile();

    builder = module.get<LangGraphBuilder>(LangGraphBuilder);
  });

  it('should handle multi-step branching based on context updates', async () => {
    // 1. Define a complex template with: Start -> CollectInfo -> CheckIntent -> (Booking | Support) -> End
    // Note: 'CollectInfo' adds data to context
    const template = {
      nodes: [
        {
          id: 'start',
          type: 'say',
          data: { text: 'Hello, how can I help?' },
          next_node_id: 'collect-info',
        },
        {
          // Simulating a node that updates context (in real app, this might be a tool node)
          // For now, we simulate the effect by pre-seeding the context
          id: 'collect-info',
          type: 'say',
          data: { text: 'Listening...' },
          next_node_id: 'check-intent',
        },
        {
          id: 'check-intent',
          type: 'smartlisten',
          data: {
            intents: [
              { intentName: 'booking', nextId: 'booking-flow' },
              { intentName: 'support', nextId: 'support-flow' },
            ],
          },
        },
        {
          id: 'booking-flow',
          type: 'say',
          data: { text: 'Starting booking...' },
          next_node_id: 'end',
        },
        {
          id: 'support-flow',
          type: 'say',
          data: { text: 'Transferring to support...' },
          next_node_id: 'end',
        },
        {
          id: 'end',
          type: 'say',
          data: { text: 'Bye' },
        },
      ],
    } as unknown as WorkflowTemplate;

    // 2. Build Graph
    const app = await builder.build(template);

    // 3. Execute Scenario A: Booking
    const bookingState: AgentState = {
      messages: [new HumanMessage('Hi')],
      context: { simulatedIntent: 'booking' }, // Simulate context update
      currentNodeId: 'start',
      isPaused: false,
    };

    const finalBookingState = await app.invoke(bookingState);
    const bookingMessages = finalBookingState.messages
      .filter((m: any) => m._getType() === 'ai')
      .map((m: any) => m.content);

    expect(bookingMessages).toContain('Hello, how can I help?');
    expect(bookingMessages).toContain('Starting booking...');
    expect(bookingMessages).not.toContain('Transferring to support...');
    expect(bookingMessages).toContain('Bye');

    // 4. Execute Scenario B: Support
    const supportState: AgentState = {
      messages: [new HumanMessage('Hi')],
      context: { simulatedIntent: 'support' },
      currentNodeId: 'start',
      isPaused: false,
    };

    const finalSupportState = await app.invoke(supportState);
    const supportMessages = finalSupportState.messages
      .filter((m: any) => m._getType() === 'ai')
      .map((m: any) => m.content);

    expect(supportMessages).toContain('Transferring to support...');
    expect(supportMessages).not.toContain('Starting booking...');
  });
});
