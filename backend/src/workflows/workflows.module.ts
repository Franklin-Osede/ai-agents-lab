import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './interfaces/http/workflows.controller';
import { WorkflowsService } from './application/workflows.service';
import { Workflow } from './domain/workflow.entity';
import { WorkflowVersion } from './domain/workflow-version.entity';
import { WorkflowSession } from './domain/workflow-session.entity';
import { WorkflowTemplate } from './domain/entities/workflow-template.entity';
import { WorkflowExecutorService } from './application/workflow-executor.service';
import { VoiceNoteHandler } from './application/handlers/voicenote.handler';
import { UserResponseHandler } from './application/handlers/user-response.handler';
import { CalendarHandler } from './application/handlers/calendar.handler';
import { ServiceHandler } from './application/handlers/service.handler';
import { TypeOrmTemplateRepository } from './infrastructure/repositories/typeorm-template.repository';
import { GetTemplatesByNicheUseCase } from './application/use-cases/get-templates-by-niche.use-case';
import { CreateWorkflowFromTemplateUseCase } from './application/use-cases/create-workflow-from-template.use-case';
import { TemplateSeedService } from './infrastructure/seeders/template-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowVersion, WorkflowSession, WorkflowTemplate]),
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowExecutorService,
    VoiceNoteHandler,
    UserResponseHandler,
    CalendarHandler,
    ServiceHandler,
    // Template System
    TypeOrmTemplateRepository,
    GetTemplatesByNicheUseCase,
    CreateWorkflowFromTemplateUseCase,
    TemplateSeedService,
    {
      provide: 'IWorkflowTemplateRepository',
      useClass: TypeOrmTemplateRepository,
    },
  ],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
