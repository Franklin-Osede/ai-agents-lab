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

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    AgentCardComponent,
    DemoModalComponent,
    ChatInterfaceComponent,
    MetricsPanelComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

