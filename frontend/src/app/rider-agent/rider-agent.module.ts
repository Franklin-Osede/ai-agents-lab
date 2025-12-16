import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAppHomeComponent } from './components/super-app-home/super-app-home.component';
import { RiderAgentRoutingModule } from './rider-agent-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RiderAgentRoutingModule,
    SuperAppHomeComponent
  ],
  exports: [
    SuperAppHomeComponent
  ]
})
export class RiderAgentModule { }
