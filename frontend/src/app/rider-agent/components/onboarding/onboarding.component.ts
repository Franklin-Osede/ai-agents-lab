import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { UserSessionService } from "../../services/user-session.service";
import { PollyTTSService } from "../../../shared/services/polly-tts.service";
import { Location } from "@angular/common";

@Component({
  selector: "app-onboarding",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./onboarding.component.html",
  styleUrls: ["./onboarding.component.scss"],
})
export class OnboardingComponent implements OnInit, OnDestroy {
  name = "";
  router = inject(Router);
  session = inject(UserSessionService);
  private pollyService = inject(PollyTTSService);
  location = inject(Location);
  platformId = inject(PLATFORM_ID);

  private welcomeAudioPlayed = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Clear any previous session ensuring a fresh start
      this.session.logout();
      // Also clear usage flag so it plays every time we land here (like a fresh start)
      sessionStorage.removeItem("rider_welcome_played");

      // Stop any existing audio first
      this.pollyService.stop();

      // Small delay to ensure clean state
      setTimeout(() => {
        this.playWelcomeMessage();
      }, 300);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.pollyService.stop();
    }
  }

  playWelcomeMessage() {
    if (this.welcomeAudioPlayed) return;
    this.welcomeAudioPlayed = true;

    const text =
      "Hola, bienvenido a Rider Agent. Escríbenos tu nombre y continúa con el pedido.";

    // Use Polly Service for Neural voice
    this.pollyService.speak(text);
  }

  continue() {
    if (this.name.trim().length > 0) {
      this.session.login(this.name.trim());
      this.router.navigate(["/rider/home"]);
    }
  }

  exploreGuest() {
    this.session.login("Invitado");
    this.router.navigate(["/rider/home"]);
  }

  goBack() {
    // If there is history go back, otherwise go to main landing
    // Actually, user wants to go back from this screen.
    // If this is the entry point /rider, going back might mean root /
    this.router.navigate(["/"]);
  }
}
