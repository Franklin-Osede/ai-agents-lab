import { Injectable, signal, effect, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

export interface UserProfile {
  name: string;
  avatarUrl: string;
  gender: "male" | "female";
}

@Injectable({
  providedIn: "root",
})
export class UserSessionService {
  private platformId = inject(PLATFORM_ID);

  // Signals for reactive state
  user = signal<UserProfile | null>(null);
  homeGreetingPlayed = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Load from local storage on init
      const saved = localStorage.getItem("rider_user_session");
      if (saved) {
        this.user.set(JSON.parse(saved));
      }
    }
  }

  login(name: string) {
    const isFemale = this.isFemaleName(name);
    const avatarUrl = isFemale
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

    const profile: UserProfile = {
      name,
      avatarUrl,
      gender: isFemale ? "female" : "male",
    };

    this.user.set(profile);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem("rider_user_session", JSON.stringify(profile));
    }
  }

  logout() {
    this.user.set(null);
    this.homeGreetingPlayed = false; // Reset greeting flag on logout
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem("rider_user_session");
    }
  }

  private isFemaleName(name: string): boolean {
    const n = name.trim().toLowerCase();
    // Common Spanish female names that don't end in 'a'
    const femaleExceptions = [
      "isabel",
      "carmen",
      "beatriz",
      "pilar",
      "luz",
      "sol",
      "rocío",
      "rocio",
      "dolores",
      "mercedes",
      "consuelo",
      "inés",
      "ines",
      "belen",
      "belén",
      "raquel",
      "esther",
      "ester",
      "rut",
      "ruth",
      "paz",
      "soledad",
    ];

    return n.endsWith("a") || femaleExceptions.includes(n);
  }
}
