import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AgentCardComponent } from './shared/components/agent-card/agent-card.component';
import { DemoModalComponent } from './shared/components/demo-modal/demo-modal.component';
import { ChatInterfaceComponent } from './shared/components/chat-interface/chat-interface.component';
import { MetricsPanelComponent } from './shared/components/metrics-panel/metrics-panel.component';
import { EntityExtractionComponent } from './shared/components/entity-extraction/entity-extraction.component';
import { VoicePlayerComponent } from './shared/components/voice-player/voice-player.component';
import { ServiceSelectorComponent } from './shared/components/service-selector/service-selector.component';
import { CalendarComponent } from './shared/components/calendar/calendar.component';
import { RoleSelectorComponent } from './shared/components/role-selector/role-selector.component';
import { LoginComponent } from './shared/components/login/login.component';
import { RegisterComponent } from './shared/components/register/register.component';
import { ProfessionalDashboardComponent } from './components/professional-dashboard/professional-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    AgentCardComponent,
    DemoModalComponent,
    ChatInterfaceComponent,
    MetricsPanelComponent,
    EntityExtractionComponent,
    VoicePlayerComponent,
    ServiceSelectorComponent,
    CalendarComponent,
    RoleSelectorComponent,
    LoginComponent,
    RegisterComponent,
    ProfessionalDashboardComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
