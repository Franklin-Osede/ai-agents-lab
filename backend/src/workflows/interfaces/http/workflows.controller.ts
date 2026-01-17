import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { WorkflowsService } from '../../application/workflows.service';
import { WorkflowExecutorService } from '../../application/workflow-executor.service';
import { GetTemplatesByNicheUseCase } from '../../application/use-cases/get-templates-by-niche.use-case';
import { CreateWorkflowFromTemplateUseCase } from '../../application/use-cases/create-workflow-from-template.use-case';
import { NicheType } from '../../domain/value-objects/template-niche.vo';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly workflowExecutor: WorkflowExecutorService,
    private readonly getTemplatesByNiche: GetTemplatesByNicheUseCase,
    private readonly createFromTemplateUseCase: CreateWorkflowFromTemplateUseCase,
  ) {}

  // Template endpoints
  @Get('templates')
  async getTemplates(@Query('niche') niche?: NicheType) {
    if (niche) {
      const templates = await this.getTemplatesByNiche.execute(niche);
      return { data: templates };
    }
    // Return all templates if no niche specified
    return { data: [] };
  }

  @Post('from-template')
  async createWorkflowFromTemplate(
    @Body()
    body: {
      templateId: string;
      tenantId: string;
      customization: {
        agentName?: string;
        greeting?: string;
        enabledIntents?: string[];
        customIntents?: Array<{
          name: string;
          displayName: string;
          examples: string[];
          icon?: string;
        }>;
        voiceId?: string;
        primaryColor?: string;
      };
    },
  ) {
    return this.createFromTemplateUseCase.execute(body);
  }

  // Workflow endpoints
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
