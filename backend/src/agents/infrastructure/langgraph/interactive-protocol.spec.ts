import { Test, TestingModule } from '@nestjs/testing';
import { LangGraphBuilder } from './langgraph-builder.service';
import { WorkflowTemplate } from '../../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from '../../domain/agent-state.interface';
import { HumanMessage } from '@langchain/core/messages';

describe('Cycle 3: Interactive Protocol (Pause/Resume)', () => {
  let builder: LangGraphBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LangGraphBuilder],
    }).compile();

    builder = module.get<LangGraphBuilder>(LangGraphBuilder);
  });

  it('should pause at WaitInput node and resume with user input', async () => {
    // 1. Define a template with a break: Start -> Ask Question -> Wait -> Acknowledge -> End
    const template = {
      nodes: [
        {
          id: 'start',
          type: 'say',
          data: { text: "What's your name?" },
          next_node_id: 'wait-for-name',
        },
        {
          id: 'wait-for-name',
          type: 'waitinput', // Should trigger a pause
          data: {},
          next_node_id: 'acknowledge',
        },
        {
          id: 'acknowledge',
          type: 'say',
          data: { text: 'Nice to meet you' },
          next_node_id: 'end',
        },
        {
          id: 'end',
          type: 'say',
          data: { text: 'Goodbye' },
        },
      ],
    } as unknown as WorkflowTemplate;

    // 2. Build Graph
    const app = await builder.build(template);

    // 3. Start Execution
    const initialState: AgentState = {
      messages: [new HumanMessage('Start')],
      context: {},
      currentNodeId: 'start',
      isPaused: false,
    };

    // Run until interrupt.
    // In LangGraphJS, we expect it to stop BEFORE executing 'wait-for-name' or AFTER, depends on config.
    // We will target "interrupt before 'wait-for-name'".
    // So output should contain "What's your name?" and then stop.

    // NOTE: app.invoke might run to completion if interrupts aren't configured.
    // We need to verify that we can configure it to stop.
    // Using a mocked thread_id for state persistence if we were using a checkpointer,
    // but here we are testing the graph structure's ability to interrupt.

    // For this test, we assume 'builder.build' handles the conditional interrupt logic.
    // We might need to use `stream` or specific invoke config to see the pause in a real environment,
    // but here we check if the builder sets up `interruptBefore` or similar.

    // Let's assume the builder returns a compiled graph that has interrupts set for 'waitinput' nodes.

    // Executing first step
    // We expect the graph to PAUSE at 'wait-for-name'.
    // Result messages: "What's your name?"
    // The 'wait-for-name' node itself shouldn't execute or should be the stop point.

    // Since we don't have a persistent Checkpointer in this unit test setup,
    // verifying "pause" directly via `invoke` is tricky because `invoke` runs until end in memory
    // unless `interruptBefore` is set.

    const config = { configurable: { thread_id: 'test-thread' } };

    // We expect the builder to have compiled with `interruptBefore: ['wait-for-name']`
    // So `invoke` should return early.

    // However, LangGraph persistence is required for interrupts to effectively "resume" later.
    // Without a checkpointer, invoke will just stop and we lose state.
    // For this Unit/Integration test of the BUILDER, we want to ensure valid graph construction.
    // We will assume the builder uses MemorySaver or similar if needed, or we just test
    // that the graph IS configured to interrupt.

    // Testing Strategy:
    // 1. Invoke.
    // 2. Check output messages.
    // 3. If it stopped early, we shouldn't see 'Nice to meet you'.

    const partialState = await app.invoke(initialState, config);

    const messages1 = partialState.messages.map((m: any) => m.content);
    expect(messages1).toContain("What's your name?");
    expect(messages1).not.toContain('Nice to meet you'); // Should have stopped

    // 4. Resume
    // To resume, we'd typically call invoke again with the SAME thread_id and new input.
    // BUT since we don't have a real checkpointer in this basic test setup unless we inject one,
    // we might simulate the "Resumed" state by manually constructing the state resembling
    // what it would be after the pause + new input.

    // However, the critical logic we are testing is "Does the builder set strict interrupts?"
    // If the above assertions pass, we know it paused.

    // To test resumption logic (which is often just "continue"), we can manually invoke
    // starting FROM the next step 'acknowledge' with the accumulated history.

    // We manually simulate the state progression for the test:
    // Important: We must advance or set the currentNodeId to where we want to resume
    // because without a checkpointer, the new invoke is practically a new run.
    const resumedStateInput: AgentState = {
      ...partialState,
      // simulating the input that would be injected
      messages: [...partialState.messages, new HumanMessage('My name is Bond')],
      currentNodeId: 'acknowledge', // Skip wait node and resume at next step
    };

    const finalState = await app.invoke(resumedStateInput, config);
    const messages2 = finalState.messages.map((m: any) => m.content);

    expect(messages2).toContain('Nice to meet you');
    expect(messages2).toContain('Goodbye');
  });
});
