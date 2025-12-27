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
    const avatarUrl = this.getRandomAvatar(isFemale ? "female" : "male");

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
      "noemi",
      "noemí",
      "leonor",
      "guadalupe",
      "cruz",
      "mar",
      "nieve",
      "nieves",
      "angeles",
      "ángeles",
      "sara", // Sara ends in 'a' but good to be explicit if logic fails
      "sofia",
      "sofía",
      "lucia",
      "lucía", // Ditto
      "andrea",
      "paula",
      "elena",
      "julia",
      "valentina",
    ];

    // Common Spanish male names that end in 'a' (exceptions)
    const maleExceptions = [
      "luca",
      "luka",
      "jose",
      "josé",
      "borja",
      "santiago",
      "mika",
      "sasha",
      "noah",
      "elias",
      "jonah",
      "joshua",
      "yeray",
      "unai",
      "ibai",
      "bautist", // Bautista check via endsWith
    ];

    if (maleExceptions.includes(n)) return false;
    if (n.endsWith("a") && !maleExceptions.includes(n)) return true;

    return femaleExceptions.some((ex) => n.includes(ex)); // More loose matching for composite names like "Maria del Carmen"
  }

  private getRandomAvatar(gender: "male" | "female"): string {
    const maleAvatars = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    ];

    const femaleAvatars = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1520813792240-56fc4a37b1a9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    ];

    const pool = gender === "female" ? femaleAvatars : maleAvatars;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
