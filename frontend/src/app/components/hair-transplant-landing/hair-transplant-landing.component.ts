import { Component, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-hair-transplant-landing",
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: "./hair-transplant-landing.component.html",
  styleUrls: ["./hair-transplant-landing.component.scss"],
})
export class HairTransplantLandingComponent {
  private router = inject(Router);

  // No initialization needed yet

  openContact(): void {
    const calendlyUrl = "https://calendly.com/agentminds";
    window.open(calendlyUrl, "_blank");
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
