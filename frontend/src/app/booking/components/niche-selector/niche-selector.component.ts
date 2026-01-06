import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

interface NicheSubcategory {
  id: string;
  name: string;
  icon?: string; // Emoji or icon
}

interface NicheCategory {
  id: string;
  name: string;
  icon: string;
  serviceCount: number;
  color: string;
  bgColor: string;
  subcategories?: NicheSubcategory[];
  expanded?: boolean;
}

@Component({
  selector: 'app-niche-selector',
  templateUrl: './niche-selector.component.html',
  styleUrls: ['./niche-selector.component.scss'],
})
export class NicheSelectorComponent {
  private router = inject(Router);
  searchQuery = signal('');
  
  categories: NicheCategory[] = [
    {
      id: 'health',
      name: 'Salud y Bienestar',
      icon: 'vital_signs',
      serviceCount: 4,
      color: '#4f46e5',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20 text-primary',
      subcategories: [
        { id: 'doctor', name: 'Doctor 🩺' },
        { id: 'physio', name: 'Fisioterapia 🦴' },
        { id: 'dentist_sub', name: 'Dentista 🦷' },
        { id: 'nutri', name: 'Nutricionista 🥗' }
      ],
      expanded: false,
    },
    {
      id: 'beauty',
      name: 'Belleza y Estética',
      icon: 'spa',
      serviceCount: 5,
      color: '#764ba2',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20 text-[#764ba2]',
      subcategories: [
        { id: 'nails', name: 'Manicura 💅' },
        { id: 'cosmetics', name: 'Cosmética 💄' },
        { id: 'hair', name: 'Peluquería 💇‍♀️' },
        { id: 'barber', name: 'Barbería 💈' },
        { id: 'spa', name: 'Spa 🛁' }
      ],
      expanded: false,
    },
    {
      id: 'professional',
      name: 'Servicios Profesionales',
      icon: 'work',
      serviceCount: 2,
      color: '#f97316',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500',
      subcategories: [
         { id: 'fiscal', name: 'Asesoría Fiscal 📊' },
         { id: 'lawyer', name: 'Abogados ⚖️' }
      ],
      expanded: false,
    },
  ];

  toggleCategory(category: NicheCategory) {
    // Close others
    this.categories.forEach(c => {
      if (c.id !== category.id) c.expanded = false;
    });
    category.expanded = !category.expanded;
  }

  selectSubcategory(category: NicheCategory, subcategory: NicheSubcategory) {
    // Navigate to URL input for selected niche
    this.router.navigate(['/booking', category.id, 'setup'], {
      queryParams: { subcategory: subcategory.id }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
