import { Test, TestingModule } from '@nestjs/testing';
import { LangGraphBuilder } from './langgraph-builder.service';
import { MockToolExecutor } from '../tools/mock-tool-executor';
import { WorkflowTemplate } from '../../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from '../../domain/agent-state.interface';
import { HumanMessage } from '@langchain/core/messages';

describe('Cycle 4: MCP Tool Integration (Demo Mode)', () => {
  let builder: LangGraphBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangGraphBuilder,
        {
          provide: 'ToolExecutor',
          useClass: MockToolExecutor,
        },
      ],
    }).compile();

    builder = module.get<LangGraphBuilder>(LangGraphBuilder);
  });

  it('should execute Restaurant Demo: Check Availability (ToolNode)', async () => {
    // 1. Template simulating Restaurant Niche
    const template = {
      niche: { value: 'restaurant' }, // Mocking the niche VO
      nodes: [
        {
          id: 'start',
          type: 'tool',
          data: {
            toolName: 'check_availability',
            arguments: { time: '21:00' },
          },
          next_node_id: 'end',
        },
        {
          id: 'end',
          type: 'say',
          data: { text: 'Done' },
        },
      ],
    } as unknown as WorkflowTemplate;

    const app = await builder.build(template);

    const initialState: AgentState = {
      messages: [new HumanMessage('Quiero reservar a las 9')],
      context: {},
      currentNodeId: 'start',
      isPaused: false,
    };

    const finalState = await app.invoke(initialState, { configurable: { thread_id: 'demo-rest' } });

    // Verify Tool Execution Result in Context
    expect(finalState.context.toolResult).toBeDefined();
    expect(finalState.context.toolResult.success).toBe(true);
    // Mock logic: 21:00 should be full
    expect(finalState.context.toolResult.data.available).toBe(false);
    expect(finalState.context.toolResult.data.suggestion).toBe('21:30');

    // Verify Tool Message
    const toolMsg = finalState.messages.find((m: any) =>
      m.content.includes('Tool check_availability executed'),
    );
    expect(toolMsg).toBeDefined();
  });

  it('should execute Dental Demo: Patient History via Context (ToolNode)', async () => {
    const template = {
      niche: { value: 'dental' },
      nodes: [
        {
          id: 'tool-lookup',
          type: 'tool',
          data: {
            toolName: 'check_patient_history',
            // Arguments will be merged with context.name
          },
          next_node_id: 'end',
        },
        { id: 'end', type: 'say', data: { text: 'Found' } },
      ],
    } as unknown as WorkflowTemplate;

    const app = await builder.build(template);

    const result = await app.invoke(
      {
        messages: [],
        // User says "Soy Juan" -> extracts to context
        context: { name: 'Juan Perez' },
        currentNodeId: 'tool-lookup',
        isPaused: false,
      },
      { configurable: { thread_id: 'demo-dental' } },
    );

    expect(result.context.toolResult).toBeDefined();
    expect(result.context.toolResult.data.exists).toBe(true);
    expect(result.context.toolResult.data.treatment).toBe('Implante');
  });

  it('should execute Legal Demo: File Status (ToolNode)', async () => {
    const template = {
      niche: { value: 'legal' },
      nodes: [
        {
          id: 'check-docs',
          type: 'tool',
          data: { toolName: 'check_file_status' },
          next_node_id: 'end',
        },
        { id: 'end', type: 'say', data: { text: 'Checked' } },
      ],
    } as unknown as WorkflowTemplate;

    const app = await builder.build(template);
    const result = await app.invoke(
      {
        messages: [],
        context: {},
        currentNodeId: 'check-docs',
        isPaused: false,
      },
      { configurable: { thread_id: 'demo-legal' } },
    );

    expect(result.context.toolResult.data.status).toBe('pending_review');
    expect(result.context.toolResult.data.missing_docs).toContain('DNI');
  });
});
