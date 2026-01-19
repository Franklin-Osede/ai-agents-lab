import { Injectable, Inject, Optional } from '@nestjs/common';
import { StateGraph, START, END } from '@langchain/langgraph';
import { AIMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { IGraphBuilder } from '../../domain/igraph-builder.interface';
import { WorkflowTemplate } from '../../../workflows/domain/entities/workflow-template.entity';
import { AgentState } from '../../domain/agent-state.interface';
import { ToolExecutor } from '../../domain/tool-executor.interface';

@Injectable()
export class LangGraphBuilder implements IGraphBuilder {
  constructor(
    @Optional()
    @Inject('ToolExecutor')
    private readonly toolExecutor?: ToolExecutor,
  ) {}

  async build(template: WorkflowTemplate): Promise<Runnable<AgentState, AgentState>> {
    // 1. Define the Graph State
    // Cast config to any to avoid "is not assignable to parameter of type 'never'"
    const graphBuilder = new StateGraph<AgentState>({
      channels: {
        messages: {
          reducer: (x: any[], y: any[]) => x.concat(y),
          default: () => [],
        },
        context: {
          reducer: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        currentNodeId: {
          reducer: (x: string, y: string) => y,
          default: () => 'start',
        },
        isPaused: {
          reducer: (x: boolean, y: boolean) => y,
          default: () => false,
        },
      },
    } as any);

    // 2. Add Nodes
    template.nodes.forEach((node) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      graphBuilder.addNode(node.id, async (state: AgentState) => {
        const text = node.data?.text || node.data?.content || 'Hello';

        if (node.type === 'say' || node.type === 'voicenote') {
          return {
            messages: [new AIMessage(text)],
            currentNodeId: node.id,
          };
        }

        if (node.type === 'tool') {
          if (!this.toolExecutor) {
            console.warn('ToolExecutor not found, skipping tool execution');
            return { currentNodeId: node.id };
          }

          const toolName = node.data?.toolName;
          const args = node.data?.arguments || {};
          // Extract niche from template. Assuming template.niche is accessible or simplified.
          // Since WorkflowTemplate entity might structurally vary or rely on getter, safely access.
          const niche = (template as any).niche?.value || 'generic';

          try {
            const result = await this.toolExecutor.execute({
              toolName,
              arguments: { ...args, ...state.context }, // Merge context into args for dynamic values
              context: { niche, fullContext: state.context },
            });

            return {
              context: { toolResult: result },
              currentNodeId: node.id,
              messages: [
                new AIMessage(`Tool ${toolName} executed. Result: ${JSON.stringify(result.data)}`),
              ],
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
              context: { toolError: errorMessage },
              currentNodeId: node.id,
              messages: [new AIMessage(`Tool ${toolName} failed: ${errorMessage}`)],
            };
          }
        }

        // Return matching partial state even if empty
        return {
          currentNodeId: node.id,
        };
      });
    });

    // 3. Add Edges
    if (template.nodes.length > 0) {
      // Aggressive casting for all edge adders
      // Cycle 3: Dynamic Entry Point (Resume capability)
      graphBuilder.addConditionalEdges(START as any, (state: AgentState) => {
        if (state.currentNodeId && state.currentNodeId !== 'start') {
          return state.currentNodeId;
        }
        return template.nodes[0].id;
      });
    }

    template.nodes.forEach((node) => {
      // Handle Branching for SmartListen
      if (node.type === 'smartlisten' && node.data?.intents) {
        graphBuilder.addConditionalEdges(
          node.id as any,
          (state: AgentState) => {
            // Cycle 2 Logic: Check context for intent
            // In real app, this would use ConditionEvaluator or check state.intents
            const detectedIntent = state.context?.simulatedIntent;
            const match = node.data!.intents.find((i: any) => i.intentName === detectedIntent);
            return match ? match.nextId : END;
          },
          // Optional: mapping for visualization/validation
          // node.data.intents.reduce((acc, i) => ({ ...acc, [i.nextId]: i.nextId }), {})
        );
      } else if (node.next_node_id) {
        graphBuilder.addEdge(node.id as any, node.next_node_id as any);
      } else {
        graphBuilder.addEdge(node.id as any, END as any);
      }
    });

    // 4. Compile
    // Cycle 3: Identify nodes that require interruption (WaitInput)
    const interruptNodes = template.nodes.filter((n) => n.type === 'waitinput').map((n) => n.id);

    return graphBuilder.compile({
      interruptBefore: interruptNodes as any,
    }) as any;
  }
}
