import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { Agent } from "../../shared/models/agent.model";
import { environment } from "../../../environments/environment"; // Import Environment

@Component({
  selector: "app-landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
})
export class LandingPageComponent implements OnInit {
  selectedAgent: Agent | null = null;
  filteredAgents: any[] = []; // List to be displayed

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Initialize filteredAgents immediately to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.filterAgents();
  }

  // Source of truth for all agents
  private allAgents = [
    {
      id: "booking",
      name: "Planificación inteligente",
      description:
        "Tus pacientes pueden reservar, cambiar o cancelar citas solo hablando. Adiós a los buzones de voz.",
      icon: "calendar_month",
      features: ["Reservas Automáticas", "Siempre Puntual", "Fuera de Horario"],
      endpoint: "/agents/booking",
      color: "blue",
    },
    {
      id: "noshows",
      name: "Evita los No-Shows",
      description: "Automatiza recordatorios, cobra depósitos y reprograma citas para mantener la agenda llena.",
      icon: "event_busy",
      features: ["Recordatorios", "Reprogramación Fácil", "Lista de Espera"],
      endpoint: "/agents/noshows",
      color: "blue",
    },
    {
      id: "triaje",
      name: "Anamnesis Previa",
      description:
        "Tu asistente recoge síntomas y antecedentes antes de la cita, ofreciéndote información estructurada.",
      icon: "medical_information",
      features: ["Filtro de Curiosos", "Historial Médico", "Automatización FAQ"],
      endpoint: "/agents/triaje",
      color: "blue",
    },
    {
      id: "voice",
      name: "Seguimiento sin esfuerzo",
      description:
        "Contacta al paciente tras la visita para resolver dudas o revisar pautas. Todo queda registrado.",
      icon: "monitor_heart",
      features: ["Pautas Claras", "Fidelización", "Control Post-Visita"],
      endpoint: "/agents/voice",
      color: "blue",
    },
  ];

  ngOnInit(): void {
    // filteredAgents is already initialized in constructor
    // Only update if needed (e.g., environment changed)
    // Use setTimeout to ensure it runs after view initialization
    setTimeout(() => {
      const currentCount = this.filteredAgents.length;
      this.filterAgents();
      // Only trigger change detection if the count actually changed
      if (this.filteredAgents.length !== currentCount) {
        this.cdr.detectChanges();
      }
    }, 0);
  }

  filterAgents() {
    // Logic to hide agents based on environment
    const enabled = (environment as any).enabledAgents;
    console.log("LANDING: Enabled Agents:", enabled);

    if (enabled && Array.isArray(enabled)) {
      this.filteredAgents = this.allAgents; // Just show all our clinical agents
    } else {
      // Fallback
      this.filteredAgents = this.allAgents;
    }
    console.log("LANDING: Displaying:", this.filteredAgents);
  }

  navigateToProfessional(): void {
    console.log("Navigating to professional dashboard...");
    this.router.navigate(["/professional"]).then((success) => {
      console.log("Navigation result:", success);
      if (!success) {
        console.error("Navigation failed!");
      }
    });
  }

  openDemo(agentId: string): void {
    // Navigate to new booking flow for all agents
    // This replaces the old modal approach
    this.router.navigate(['/booking', 'select-niche']);
  }

  closeDemo(): void {
    this.selectedAgent = null;
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  scrollToAgents(): void {
    const element = document.getElementById("agents-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  openContact(): void {
    const calendlyUrl = "https://calendly.com/agentminds";
    window.open(calendlyUrl, "_blank");
  }
}
