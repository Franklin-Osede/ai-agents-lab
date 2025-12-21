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
      id: "restaurantes",
      name: "Restaurantes y Comida",
      icon: "restaurant",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      expanded: true,
      services: [
        {
          id: "delivery",
          name: "Delivery / A Domicilio",
          description: "Pide tu comida favorita a domicilio",
          businessType: "restaurante",
          tone: "cordial, rápido y eficiente",
        },
        {
          id: "restaurante",
          name: "Reserva de Mesa",
          description: "Reserva mesa en tus restaurantes favoritos",
          businessType: "restaurante",
          tone: "cordial, profesional y acogedor",
        },
        // {
        //   id: 'catering',
        //   name: 'Catering para Eventos',
        //   description: 'Servicios de catering para grupos',
        //   businessType: 'restaurante',
        //   tone: 'profesional y detallado',
        // },
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
