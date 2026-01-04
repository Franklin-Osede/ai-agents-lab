import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { KnowledgeRoutingModule } from './knowledge-routing.module';
import { KnowledgeComponent } from './knowledge.component';
import { SetupAgentComponent } from './setup-agent/setup-agent.component';
import { TrainingOverlayComponent } from './training-overlay/training-overlay.component';

@NgModule({
  declarations: [
    KnowledgeComponent,
    SetupAgentComponent,
    TrainingOverlayComponent,
  ],
  imports: [CommonModule, HttpClientModule, FormsModule, KnowledgeRoutingModule],
})
export class KnowledgeModule {}
