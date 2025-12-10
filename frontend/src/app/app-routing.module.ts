import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

import { ProfessionalDashboardComponent } from './components/professional-dashboard/professional-dashboard.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'professional', component: ProfessionalDashboardComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

