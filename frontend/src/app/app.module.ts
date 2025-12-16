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
import { GoogleMapsAutocompleteComponent } from './shared/components/google-maps-autocomplete/google-maps-autocomplete.component';
import { WelcomeChatComponent } from './abandoned-cart/components/welcome-chat/welcome-chat.component';
import { RiderAgentModule } from './rider-agent/rider-agent.module';
import { SuperAppHomeComponent } from './rider-agent/components/super-app-home/super-app-home.component';

// Note: Abandoned Cart components are standalone and don't need to be declared here
// They are imported directly in routes

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    AgentCardComponent,

    MetricsPanelComponent,
    EntityExtractionComponent,
    RoleSelectorComponent,
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule, 
    HttpClientModule, 
    FormsModule, 
    WelcomeChatComponent, 
    RiderAgentModule, 
    SuperAppHomeComponent, 
    DemoModalComponent,
    ChatInterfaceComponent,
    ServiceSelectorComponent,
    CalendarComponent,
    VoicePlayerComponent,
    GoogleMapsAutocompleteComponent
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
