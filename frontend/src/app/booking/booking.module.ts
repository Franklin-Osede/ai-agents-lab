import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoiceBookingComponent } from './components/voice-booking/voice-booking.component';
import { NicheSelectorComponent } from './components/niche-selector/niche-selector.component';
import { UrlInputComponent } from './components/url-input/url-input.component';
import { TrainingProgressComponent } from './components/training-progress/training-progress.component';
import { MobileLayoutComponent } from '../abandoned-cart/components/mobile-layout/mobile-layout.component';
import { KnowledgePreviewComponent } from './components/knowledge-preview/knowledge-preview.component';

const routes: Routes = [
  {
    path: '',
    component: MobileLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'select-niche',
        pathMatch: 'full',
      },
      {
        path: 'select-niche',
        component: NicheSelectorComponent,
      },
      {
        path: ':niche/setup',
        component: UrlInputComponent,
      },
      {
        path: ':niche/training',
        component: TrainingProgressComponent,
      },
      {
        path: ':niche/preview',
        component: KnowledgePreviewComponent,
      },
      {
        path: 'voice', // Legacy route wrapped too for consistency, or move out if needed
        component: VoiceBookingComponent,
      },
    ]
  }
];

@NgModule({
  declarations: [
    VoiceBookingComponent,
    NicheSelectorComponent,
    UrlInputComponent,
    TrainingProgressComponent,
    KnowledgePreviewComponent,
  ],
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule.forChild(routes),
    MobileLayoutComponent // Import standalone component
  ],
})
export class BookingModule {}
