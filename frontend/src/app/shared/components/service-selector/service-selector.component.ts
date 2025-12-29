import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface Service {
  id: string;
  name: string;
  description: string;
  businessType: string;
  tone?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  services: Service[];
  expanded: boolean;
}

import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-service-selector",
  templateUrl: "./service-selector.component.html",
  styleUrls: ["./service-selector.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ServiceSelectorComponent {
  @Output() serviceSelected = new EventEmitter<any>();
  @Output() back = new EventEmitter<void>();

  searchQuery = "";

  categories: ServiceCategory[] = [
    {
      id: "salud",
      name: "Salud y Bienestar",
      icon: "health_and_safety",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      expanded: false,
      services: [
        {
          id: "clinica",
          name: "Clínica Médica",
          description: "Consultas generales y especializadas",
          businessType: "salud",
          tone: "profesional, empático y tranquilizador",
        },
        {
          id: "dentista",
          name: "Clínica Dental",
          description: "Revisiones, limpiezas y tratamientos",
          businessType: "dentista",
          tone: "profesional, tranquilizador y comprensivo",
        },
        {
          id: "fisioterapia",
          name: "Fisioterapia",
          description: "Rehabilitación y masajes terapéuticos",
          businessType: "salud",
          tone: "profesional y motivador",
        },
      ],
    },
    {
      id: "belleza",
      name: "Belleza y Estética",
      icon: "spa",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      expanded: false,
      services: [
        {
          id: "peluqueria",
          name: "Peluquería",
          description: "Cortes, tintes y tratamientos capilares",
          businessType: "belleza",
          tone: "amigable, acogedor y entusiasta",
        },
        {
          id: "estetica",
          name: "Centro de Estética",
          description: "Tratamientos faciales y corporales",
          businessType: "belleza",
          tone: "amigable, acogedor y entusiasta",
        },
        {
          id: "unas",
          name: "Manicura y Pedicura",
          description: "Cuidado y diseño de uñas",
          businessType: "belleza",
          tone: "amigable y acogedor",
        },
      ],
    },
    {
      id: "profesionales",
      name: "Servicios Profesionales",
      icon: "work",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      expanded: false,
      services: [
        {
          id: "abogado",
          name: "Despacho Legal",
          description: "Consultas y asesoría legal",
          businessType: "profesional",
          tone: "profesional, formal y confiable",
        },
        {
          id: "contador",
          name: "Asesoría Fiscal",
          description: "Contabilidad y declaraciones",
          businessType: "profesional",
          tone: "profesional, preciso y confiable",
        },
      ],
    },
  ];

  get filteredCategories(): ServiceCategory[] {
    if (!this.searchQuery.trim()) {
      return this.categories;
    }

    const query = this.searchQuery.toLowerCase();
    return this.categories
      .map((category) => ({
        ...category,
        services: category.services.filter(
          (service) =>
            service.name.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.services.length > 0);
  }

  toggleCategory(category: ServiceCategory): void {
    category.expanded = !category.expanded;
  }

  onServiceClick(service: Service, category: ServiceCategory): void {
    // Emit service with full context
    this.serviceSelected.emit({
      ...service,
      categoryId: category.id,
      categoryName: category.name,
    });
  }

  onBackClick(): void {
    this.back.emit();
  }
}
