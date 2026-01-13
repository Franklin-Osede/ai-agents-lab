import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WorkflowsService } from '../../application/workflows.service';

import { WorkflowExecutorService } from '../../application/workflow-executor.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly workflowExecutor: WorkflowExecutorService,
  ) {}

  @Post()
  async createWorkflow(@Body() body: { niche: string; name: string }) {
    return this.workflowsService.createWorkflow(body.niche, body.name);
  }

  @Post('template/:templateId')
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { niche: string },
  ) {
    return this.workflowsService.createFromTemplate(body.niche, templateId);
  }

  @Get('detail/:id')
  async getById(@Param('id') id: string) {
    return this.workflowsService.getById(id);
  }

  @Get(':niche')
  async getByNiche(@Param('niche') niche: string) {
    return this.workflowsService.getLatestByNiche(niche);
  }

  @Post(':id/versions')
  async saveDraft(
    @Param('id') id: string,
    @Body()
    body: {
      nodes: Record<string, unknown>[];
      settings: Record<string, unknown>;
    },
  ) {
    return this.workflowsService.saveDraft(id, {
      nodes: body.nodes,
      settings: body.settings,
    });
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.workflowsService.publishVersion(id);
  }

  @Post(':id/execute')
  async execute(@Param('id') id: string) {
    return this.workflowExecutor.startSession(id);
  }

  @Post('sessions/:sessionId/next')
  async nextStep(@Param('sessionId') sessionId: string, @Body() body: { input: unknown }) {
    return this.workflowExecutor.executeStep(sessionId, body.input);
  }
}
