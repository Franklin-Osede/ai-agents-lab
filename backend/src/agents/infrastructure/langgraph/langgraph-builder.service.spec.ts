import { Test, TestingModule } from '@nestjs/testing';
import { LangGraphBuilder } from './langgraph-builder.service';
import { WorkflowTemplate } from '../../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from '../../domain/agent-state.interface';
import { HumanMessage } from '@langchain/core/messages';

describe('LangGraphBuilder (Infrastructure)', () => {
  let builder: LangGraphBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LangGraphBuilder],
    }).compile();

    builder = module.get<LangGraphBuilder>(LangGraphBuilder);
  });

  it('should compile a linear flow (Cycle 1: Say -> Say)', async () => {
    // 1. Given a simple linear template
    const template = {
      nodes: [
        {
          id: 'start-node',
          type: 'say',
          data: { text: 'Hello' },
          next_node_id: 'end-node',
        },
        {
          id: 'end-node',
          type: 'say',
          data: { text: 'World' },
          next_node_id: null,
        },
      ],
    } as unknown as WorkflowTemplate;

    // 2. When we build the graph
    const app = await builder.build(template);

    // 3. And run it
    const initialState: AgentState = {
      messages: [new HumanMessage('Start')],
      context: {},
      currentNodeId: 'start-node',
      isPaused: false,
    };

    const finalState = await app.invoke(initialState);

    // 4. Then it should have executed both nodes
    const aiMessages = finalState.messages.slice(1); // Skip initial HumanMessage
    expect(aiMessages.length).toBe(2);
    expect(aiMessages[0].content).toBe('Hello');
    expect(aiMessages[1].content).toBe('World');
  });

  it('should route based on intent (Cycle 2: SmartListen -> Branching)', async () => {
    // 1. Given a template with branching
    const template = {
      nodes: [
        {
          id: 'start-node',
          type: 'say',
          data: { text: 'Welcome' },
          next_node_id: 'smart-listen',
        },
        {
          id: 'smart-listen',
          type: 'smartlisten', // <--- Logic for routing
          data: {
            intents: [
              { intentName: 'booking', nextId: 'booking-flow' }, // Custom property for test
              { intentName: 'support', nextId: 'support-flow' },
            ],
          },
          // No single next_node_id, branching logic instead
        },
        {
          id: 'booking-flow',
          type: 'say',
          data: { text: 'Booking Process' },
          next_node_id: 'end-node',
        },
        {
          id: 'support-flow',
          type: 'say',
          data: { text: 'Support Process' },
          next_node_id: 'end-node',
        },
        {
          id: 'end-node',
          type: 'say',
          data: { text: 'Goodbye' },
        },
      ],
    } as unknown as WorkflowTemplate;

    // 2. When we build the graph
    const app = await builder.build(template);

    // 3. And run it simulating 'booking' intent
    // We mock the state update that SmartListen would ideally produce
    // Or we rely on SmartListen node logic to inspect input.
    // For this infrastructure test, assuming SmartListen updates 'intent' in state based on input
    const bookingState: AgentState = {
      messages: [new HumanMessage('I want to book')],
      context: { simulatedIntent: 'booking' }, // Mocking extraction result
      currentNodeId: 'start-node',
      isPaused: false,
    };

    const finalState = await app.invoke(bookingState);

    // 4. Then it should follow the booking path
    // Path: start-node (Welcome) -> smart-listen -> booking-flow (Booking Process) -> end-node (Goodbye)
    // Messages: Welcome, Booking Process, Goodbye
    // Note: SmartListen usually doesn't output message, just routes.

    const aiMessages = finalState.messages.filter((m: any) => m._getType() === 'ai');
    const contents = aiMessages.map((m: any) => m.content);

    expect(contents).toContain('Welcome');
    expect(contents).toContain('Booking Process');
    expect(contents).not.toContain('Support Process');
    expect(contents).toContain('Goodbye');
  });
});
