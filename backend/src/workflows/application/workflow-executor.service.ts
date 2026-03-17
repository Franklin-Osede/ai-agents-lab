import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowSession } from '../domain/workflow-session.entity';
import { WorkflowVersion } from '../domain/workflow-version.entity';
import { NodeExecutionResult } from './handlers/node-handler.interface';
import { VoiceNoteHandler } from './handlers/voicenote.handler';
import { UserResponseHandler } from './handlers/user-response.handler';
import { CalendarHandler } from './handlers/calendar.handler';
import { ServiceHandler } from './handlers/service.handler';

@Injectable()
export class WorkflowExecutorService {
  constructor(
    @InjectRepository(WorkflowSession)
    private sessionRepository: Repository<WorkflowSession>,
    @InjectRepository(WorkflowVersion)
    private versionsRepository: Repository<WorkflowVersion>,
    private voiceNoteHandler: VoiceNoteHandler,
    private userResponseHandler: UserResponseHandler,
    private calendarHandler: CalendarHandler,
    private serviceHandler: ServiceHandler,
  ) {}

  async startSession(workflowId: string, knowledgeSourceId?: string): Promise<any> {
    // 1. Get Active Version (For MVP, just taking latest published, or latest draft if none)
    // In real app, we would look up Workflow.activeVersionId
    const version = await this.versionsRepository.findOne({
      where: { workflowId },
      order: { createdAt: 'DESC' },
    });

    if (!version) throw new NotFoundException('No workflow version found');

    // 2. Find Start Node (First node in array usually, or one with no inputs - simple heuristic)
    // For now, assuming index 0 is start
    const startNode = version.nodes[0];
    if (!startNode) throw new BadRequestException('Workflow is empty');

    // 3. Create Session
    const session = this.sessionRepository.create({
      workflowId,
      versionId: version.id,
      knowledgeSourceId, // Save the link to the scraped data
      currentNodeId: startNode.id,
      variables: {},
      history: [],
      status: 'active',
    });
    const savedSession = await this.sessionRepository.save(session);

    // 4. Execute First Step
    return this.executeStep(savedSession.id);
  }

  async executeStep(sessionId: string, input?: any): Promise<any> {
    // 1. Load Session
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    if (session.status !== 'active') {
      return { status: session.status, message: 'Session is not active' };
    }

    // 2. Load Graph
    const version = await this.versionsRepository.findOne({ where: { id: session.versionId } });
    if (!version) throw new NotFoundException('Version not found');

    // 3. Find Current Node
    const currentNode = version.nodes.find((n: any) => n.id === session.currentNodeId);
    if (!currentNode) {
      // Maybe we reached the end?
      session.status = 'completed';
      await this.sessionRepository.save(session);
      return { status: 'completed' };
    }

    // 4. Dispatch to Handler (Strategy Pattern)
    let result: NodeExecutionResult;
    switch (currentNode.type) {
      case 'voicenote':
        result = await this.voiceNoteHandler.execute(currentNode, session, input);
        break;
      case 'userresponse':
        result = await this.userResponseHandler.execute(currentNode, session, input);
        break;
      case 'calendar':
        result = await this.calendarHandler.execute(currentNode, session, input);
        break;
      case 'services':
        result = await this.serviceHandler.execute(currentNode, session, input);
        break;
      default:
        // Default execution: just move next
        const next = currentNode.connections?.[0];
        result = { nextNodeId: next, response: { type: 'unknown', id: currentNode.id } };
    }

    // 5. Update Session (Variables, History)
    if (result.updates) {
      if (result.updates.variables) {
        session.variables = { ...session.variables, ...result.updates.variables };
      }
      if (result.updates.history) {
        session.history = result.updates.history;
      }
    }

    // 6. Handle Transition
    if (result.nextNodeId) {
      // Move pointer
      session.currentNodeId = result.nextNodeId;
      await this.sessionRepository.save(session);

      // RECURSIVE STEP:
      // If the current node was an "Output Only" node (like VoiceNote) and it
      // successfully finished, we might want to immediately tell the client "Here is the audio, AND here is the next step".
      // But for SIMPLICITY/SYNC/ASYNC separation:
      // We return the result. The client plays it.
      // If the result says "status: completed" (like VoiceNote), the CLIENT requests /next.
      // OR: We can return the *next* node immediately if it's purely server-side transition.

      // For MVP: Return the result. The Client is the driver.
      // UNLESS the handler specifically said "Wait for input" (nextNodeId is null).

      return {
        process: {
          sessionId: session.id,
          current: result.response,
          nextStepAvailable: true, // Hint to client to call /next immediately if it wants
        },
      };
    } else {
      // No next node immediately (waiting for input) OR end of flow
      await this.sessionRepository.save(session);
      return {
        process: {
          sessionId: session.id,
          current: result.response,
          nextStepAvailable: false, // Client must provide input
        },
      };
    }
  }
}
