import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';


import { ThinkingProcessComponent } from './components/thinking-process/thinking-process.component';
import { LiveMatrixComponent } from './components/live-matrix/live-matrix.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ThinkingProcessComponent,
    LiveMatrixComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
