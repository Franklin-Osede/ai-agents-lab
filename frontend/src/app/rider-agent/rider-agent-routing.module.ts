import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileLayoutComponent } from '../abandoned-cart/components/mobile-layout/mobile-layout.component';
import { SuperAppHomeComponent } from './components/super-app-home/super-app-home.component';
import { AiConciergeComponent } from './components/ai-concierge/ai-concierge.component';

const routes: Routes = [
  {
    path: '', 
    component: MobileLayoutComponent,
    children: [
      { path: '', component: SuperAppHomeComponent },
      { path: 'chat', component: AiConciergeComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RiderAgentRoutingModule { }
