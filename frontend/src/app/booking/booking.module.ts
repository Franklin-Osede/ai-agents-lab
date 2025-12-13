import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { VoiceBookingComponent } from './components/voice-booking/voice-booking.component';

const routes: Routes = [
  {
    path: '',
    component: VoiceBookingComponent,
  },
];

@NgModule({
  declarations: [VoiceBookingComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class BookingModule {}
