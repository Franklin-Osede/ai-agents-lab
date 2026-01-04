import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SetupAgentComponent } from './setup-agent/setup-agent.component';
import { TrainingOverlayComponent } from './training-overlay/training-overlay.component';

const routes: Routes = [
  { path: '', redirectTo: 'setup', pathMatch: 'full' },
  { path: 'setup', component: SetupAgentComponent },
  { path: 'training', component: TrainingOverlayComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KnowledgeRoutingModule {}
