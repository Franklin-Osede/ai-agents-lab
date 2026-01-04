import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AbandonedCartDashboardComponent } from './abandoned-cart/components/dashboard/dashboard.component';
import { CartListComponent } from './abandoned-cart/components/cart-list/cart-list.component';
import { CartDetailComponent } from './abandoned-cart/components/cart-detail/cart-detail.component';
import { CustomerActivityComponent } from './abandoned-cart/components/customer-activity/customer-activity.component';
import { CampaignEditorComponent } from './abandoned-cart/components/campaign-editor/campaign-editor.component';
import { CampaignResultsComponent } from './abandoned-cart/components/campaign-results/campaign-results.component';
import { CampaignListComponent } from './abandoned-cart/components/campaign-list/campaign-list.component';
import { MobileLayoutComponent } from './abandoned-cart/components/mobile-layout/mobile-layout.component';

import { WelcomeChatComponent } from './abandoned-cart/components/welcome-chat/welcome-chat.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  // Abandoned Cart Routes with Mobile Layout Wrapper
  {
    path: 'abandoned-cart',
    component: MobileLayoutComponent,
    children: [
      { path: '', component: WelcomeChatComponent },
      { path: 'dashboard', component: AbandonedCartDashboardComponent },
      { path: 'list', component: CartListComponent },
      { path: 'campaign/new', component: CampaignEditorComponent },
      { path: 'campaigns', component: CampaignListComponent },
      { path: 'campaign/:id/results', component: CampaignResultsComponent },
      { path: 'performance', loadComponent: () => import('./abandoned-cart/components/recovery-performance/recovery-performance.component').then(m => m.RecoveryPerformanceComponent) },
      { path: 'customer/:id', component: CustomerActivityComponent },
      { path: ':id', component: CartDetailComponent },
    ],
  },
  // Voice Booking Route
  {
    path: 'booking',
    loadChildren: () => import('./booking/booking.module').then(m => m.BookingModule),
  },
  // Rider Agent Route
  {
    path: 'rider',
    loadChildren: () => import('./rider-agent/rider-agent.module').then(m => m.RiderAgentModule),
  },
  // Legacy route redirects to new dashboard
  { path: 'professional', redirectTo: '/abandoned-cart', pathMatch: 'full' },
  { path: 'knowledge', loadChildren: () => import('./knowledge/knowledge.module').then(m => m.KnowledgeModule) },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

