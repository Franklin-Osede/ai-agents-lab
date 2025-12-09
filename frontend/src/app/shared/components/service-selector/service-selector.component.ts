import { Component, EventEmitter, Output } from '@angular/core';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-service-selector',
  templateUrl: './service-selector.component.html',
  styleUrls: ['./service-selector.component.scss'],
})
export class ServiceSelectorComponent {
  @Output() serviceSelected = new EventEmitter<ServiceCategory>();
  @Output() back = new EventEmitter<void>();

  searchQuery = '';
  selectedCategory = 'all';

  categories: ServiceCategory[] = [
    {
      id: 'salud',
      name: 'Salud',
      description: 'Medicina general, dentistas y terapia',
      icon: 'medical_services',
      color: 'text-green-600 dark:text-primary',
      bgColor: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      id: 'belleza',
      name: 'Belleza',
      description: 'Peluquería, manicura y tratamientos',
      icon: 'spa',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10',
    },
    {
      id: 'automovil',
      name: 'Automóvil',
      description: 'Mantenimiento, lavado y reparación',
      icon: 'car_repair',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      id: 'hogar',
      name: 'Hogar',
      description: 'Limpieza, fontanería y jardinería',
      icon: 'cleaning_services',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    },
    {
      id: 'mascotas',
      name: 'Mascotas',
      description: 'Veterinaria, paseos y cuidado',
      icon: 'pets',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-500/10',
    },
  ];

  filterChips = [
    { id: 'all', name: 'Todos', icon: 'grid_view' },
    { id: 'salud', name: 'Salud', icon: 'stethoscope' },
    { id: 'belleza', name: 'Belleza', icon: 'content_cut' },
    { id: 'automovil', name: 'Automóvil', icon: 'directions_car' },
    { id: 'hogar', name: 'Hogar', icon: 'home_repair_service' },
  ];

  get filteredCategories(): ServiceCategory[] {
    let filtered = this.categories;

    // Filter by selected category chip
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((cat) => cat.id === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(query) ||
          cat.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  onServiceClick(service: ServiceCategory): void {
    this.serviceSelected.emit(service);
  }

  onBackClick(): void {
    this.back.emit();
  }
}
