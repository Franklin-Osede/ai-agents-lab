import { Component, EventEmitter, Output } from '@angular/core';

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

@Component({
  selector: 'app-service-selector',
  templateUrl: './service-selector.component.html',
  styleUrls: ['./service-selector.component.scss'],
})
export class ServiceSelectorComponent {
  @Output() serviceSelected = new EventEmitter<any>();
  @Output() back = new EventEmitter<void>();

  searchQuery = '';

  categories: ServiceCategory[] = [
    {
      id: 'salud',
      name: 'Salud y Bienestar',
      icon: 'medical_services',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      expanded: false,
      services: [
        {
          id: 'clinica',
          name: 'Clínica Médica',
          description: 'Consultas médicas, exámenes y seguimientos',
          businessType: 'salud',
          tone: 'profesional, empático y tranquilizador',
        },
        {
          id: 'dentista',
          name: 'Clínica Dental',
          description: 'Limpiezas dentales, consultas y tratamientos',
          businessType: 'dentista',
          tone: 'profesional, tranquilizador y comprensivo',
        },
        {
          id: 'fisioterapia',
          name: 'Fisioterapia',
          description: 'Rehabilitación, masajes y terapias',
          businessType: 'salud',
          tone: 'profesional y motivador',
        },
        {
          id: 'veterinaria',
          name: 'Veterinaria',
          description: 'Consultas, vacunaciones y emergencias',
          businessType: 'salud',
          tone: 'amigable, empático y profesional',
        },
      ],
    },
    {
      id: 'belleza',
      name: 'Belleza y Estética',
      icon: 'spa',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      expanded: false,
      services: [
        {
          id: 'peluqueria',
          name: 'Peluquería',
          description: 'Cortes, peinados y coloración',
          businessType: 'belleza',
          tone: 'amigable, acogedor y entusiasta',
        },
        {
          id: 'estetica',
          name: 'Centro de Estética',
          description: 'Tratamientos faciales, corporales y depilación',
          businessType: 'belleza',
          tone: 'amigable, acogedor y entusiasta',
        },
        {
          id: 'spa',
          name: 'Spa y Bienestar',
          description: 'Masajes, relajación y tratamientos',
          businessType: 'belleza',
          tone: 'tranquilo, relajante y profesional',
        },
        {
          id: 'unas',
          name: 'Manicura y Pedicura',
          description: 'Uñas, esmaltados y tratamientos',
          businessType: 'belleza',
          tone: 'amigable y acogedor',
        },
      ],
    },
    {
      id: 'restaurantes',
      name: 'Restaurantes y Eventos',
      icon: 'restaurant',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      expanded: false,
      services: [
        {
          id: 'restaurante',
          name: 'Restaurante',
          description: 'Reservas de mesa y eventos',
          businessType: 'restaurante',
          tone: 'cordial, profesional y acogedor',
        },
        {
          id: 'catering',
          name: 'Catering',
          description: 'Servicios de catering para eventos',
          businessType: 'restaurante',
          tone: 'profesional y detallado',
        },
        {
          id: 'eventos',
          name: 'Salón de Eventos',
          description: 'Reservas para fiestas y celebraciones',
          businessType: 'restaurante',
          tone: 'entusiasta y profesional',
        },
      ],
    },
    {
      id: 'profesionales',
      name: 'Servicios Profesionales',
      icon: 'business_center',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      expanded: false,
      services: [
        {
          id: 'abogado',
          name: 'Despacho de Abogados',
          description: 'Consultas legales y asesoramiento',
          businessType: 'profesional',
          tone: 'profesional, formal y confiable',
        },
        {
          id: 'contador',
          name: 'Contador/Asesor Fiscal',
          description: 'Asesoría contable y fiscal',
          businessType: 'profesional',
          tone: 'profesional, preciso y confiable',
        },
        {
          id: 'consultor',
          name: 'Consultoría',
          description: 'Consultoría empresarial y estratégica',
          businessType: 'profesional',
          tone: 'profesional y estratégico',
        },
        {
          id: 'coach',
          name: 'Coaching Personal',
          description: 'Sesiones de coaching y desarrollo',
          businessType: 'profesional',
          tone: 'motivador y empático',
        },
      ],
    },
    {
      id: 'otros',
      name: 'Otros Negocios',
      icon: 'more_horiz',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      expanded: false,
      services: [
        {
          id: 'fontanero',
          name: 'Fontanería',
          description: 'Reparaciones e instalaciones',
          businessType: 'servicio',
          tone: 'práctico, eficiente y profesional',
        },
        {
          id: 'electricista',
          name: 'Electricista',
          description: 'Instalaciones y reparaciones eléctricas',
          businessType: 'servicio',
          tone: 'práctico, eficiente y profesional',
        },
        {
          id: 'fitness',
          name: 'Gimnasio',
          description: 'Clases grupales, entrenadores y uso de equipos',
          businessType: 'fitness',
          tone: 'motivador, energético y positivo',
        },
        {
          id: 'educacion',
          name: 'Academia/Tutorías',
          description: 'Clases particulares y cursos',
          businessType: 'educacion',
          tone: 'educativo, paciente y motivador',
        },
        {
          id: 'reparaciones',
          name: 'Reparaciones',
          description: 'Reparación de electrodomésticos y más',
          businessType: 'servicio',
          tone: 'práctico y eficiente',
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
      .map(category => ({
        ...category,
        services: category.services.filter(
          service =>
            service.name.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.services.length > 0);
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
