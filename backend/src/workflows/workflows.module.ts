import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './interfaces/http/workflows.controller';
import { WorkflowsService } from './application/workflows.service';
import { Workflow } from './domain/workflow.entity';
import { WorkflowVersion } from './domain/workflow-version.entity';
import { WorkflowSession } from './domain/workflow-session.entity';
import { WorkflowExecutorService } from './application/workflow-executor.service';
import { VoiceNoteHandler } from './application/handlers/voicenote.handler';
import { UserResponseHandler } from './application/handlers/user-response.handler';
import { CalendarHandler } from './application/handlers/calendar.handler';
import { ServiceHandler } from './application/handlers/service.handler';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowVersion, WorkflowSession])],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowExecutorService,
    VoiceNoteHandler,
    UserResponseHandler,
    CalendarHandler,
    ServiceHandler,
  ],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
