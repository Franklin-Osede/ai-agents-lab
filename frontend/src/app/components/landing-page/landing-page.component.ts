import { Component, OnInit, inject } from "@angular/core";
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

  // Source of truth for all agents
  private allAgents = [
    {
      id: "booking",
      name: "Booking Agent",
      description:
        "Gestión de citas autónoma 24/7. Elimina la fricción en tus reservas.",
      icon: "calendar_month",
      features: ["Reservas 24/7", "Sincronización Calendar", "Recordatorios"],
      endpoint: "/agents/booking",
      color: "blue",
    },
    {
      id: "cart", // ID matched with environment.ts
      name: "Abandoned Cart",
      description:
        "Recupera ventas perdidas enviando notas de voz personalizadas.",
      icon: "shopping_cart_checkout",
      features: [
        "Notas de Voz WhatsApp",
        "Disparador Automático",
        "Reportes de ROI",
      ],
      endpoint: "/agents/cart",
      color: "rose",
    },
    {
      id: "webinar", // ID matched with environment.ts
      name: "Webinar Recovery",
      description:
        "Reactiva leads que no asistieron con resúmenes personalizados.",
      icon: "video_camera_front",
      features: ["Video Personalizado", "Resumen AI", "Call-to-Action"],
      endpoint: "/agents/webinar",
      color: "purple",
    },
    {
      id: "invoice", // ID matched with environment.ts
      name: "Invoice Chaser",
      description: "Gestiona el cobro de facturas vencidas de forma amable.",
      icon: "receipt_long",
      features: ["Escalamiento Inteligente", "Multicanal", "Amigable"],
      endpoint: "/agents/invoice",
      color: "amber",
    },
    {
      id: "rider", // NEW RIDER AGENT
      name: "Rider Agent",
      description: "Control Tower para logística. Rastreo en tiempo real.",
      icon: "two_wheeler",
      features: [
        "Mapa en Vivo",
        "Alertas de Tráfico",
        "Predicción de Retrasos",
      ],
      endpoint: "/agents/rider",
      color: "orange", // New color
    },
    {
      id: "voice", // ID matched with environment.ts
      name: "Voice Brand",
      description:
        "Tu identidad de marca en voz. Mensajes y saludos humanizados.",
      icon: "graphic_eq",
      features: ["Voz Natural", "Personalización", "Multilenguaje"],
      endpoint: "/agents/voice",
      color: "emerald",
    },
  ];

  ngOnInit(): void {
    // Avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.filterAgents();
    });
  }

  filterAgents() {
    // Logic to hide agents based on environment
    const enabled = (environment as any).enabledAgents;
    console.log("LANDING: Enabled Agents:", enabled);

    if (enabled && Array.isArray(enabled)) {
      this.filteredAgents = this.allAgents.filter(
        (agent) => enabled.includes(agent.id) && agent.id !== "voice"
      );
    } else {
      // Fallback: Force hide invoice/webinar if env is missing
      const fallback = ["booking", "cart", "rider"];
      this.filteredAgents = this.allAgents.filter((agent) =>
        fallback.includes(agent.id)
      );
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
    const agent = this.allAgents.find((a) => a.id === agentId);
    if (agent) {
      this.selectedAgent = agent as any; // Cast to satisfy strict type if model differs slightly
    }
  }

  closeDemo(): void {
    this.selectedAgent = null;
  }

  toggleDarkMode(): void {
    document.documentElement.classList.toggle("dark");
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
