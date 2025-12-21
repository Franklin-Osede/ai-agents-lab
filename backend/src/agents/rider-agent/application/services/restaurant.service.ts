import { Injectable } from '@nestjs/common';
import { Restaurant } from '../../domain/entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  private restaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Burger House',
      cuisine: 'American, Fast Food',
      rating: 4.8,
      deliveryTime: '25-30 min',
      priceRange: '$$',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD4RB9aQ_3VwOrQPj1b5bCHxEBLnMMJhVf-lcRl3IlJ1Q7oqADO9XeNy8C_k2sABlPTFGAKCn8jhJZHxHk-DCbULwl2PIsk3uiT_zdgcFlMsoiXfbnUWem2ZshTZeoxq4OfdLvaGoO9hAgG802b0KcuogYpCG5SzPwEJpZ6N8-QaQzdS1O6ZYSqjMXke2QyuRb35Zg6TD033WkS8shAKhxQ6KLFPfiHSPP-0-43wILDYUxupYFg2V2x-O562LDRbZxtuf6AFkkyx5k',
    },
    {
      id: '2',
      name: 'Sushi Master',
      cuisine: 'Japanese, Sushi',
      rating: 4.9,
      deliveryTime: '35-45 min',
      priceRange: '$$$',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBvQtzTlTuPUf1Wut8cgAsZzFNmQLuStoFGjO0xsYHsDDRIZ2aIGaC4bV6Y0QeMzx5LY6TYE2AnX90BNZwmHrGkFCiJ2BKkp2RciMRksIRvDicwk6O4TyzBxF8gym0Ng_zlNjJLbkWfEGpI0-LU_SwsTjxg188f0BQ94pz1tCh1Fn0SyQl3zQM7jOZh0ekp2Q1z33mu6fDHZu8so6KRfpm4nvSHkExYZjkNXJXcXhWuSnLEsA_wOYe6Qx70JmqiqpWPwUpQ7T947Sw',
    },
    {
      id: '3',
      name: 'Bella Pizza',
      cuisine: 'Italian, Pizza',
      rating: 4.5,
      deliveryTime: '15-25 min',
      priceRange: '$$',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDa6cNTPW3ApOsQRoRk4CeSKvTwtQv6vuE8LWibKb9WEjsI91lta4ayYAsQNJTaRtpWV9ffhbr2EN5qMspcDXQ-WVxhrAKBkMWSqYgK62p98cJZfhfKmmn5DUNYezeZmCB4Bb9EcHHXJaKQ98TlcGp5o8r8GlXsTchj89ccCcw9SOucYD6cZYJ4suY3TdtPhpqZFgc8QETcTrCgyEGKJUwsw5xzLNNGamiEjGHvmkW1fZH3U6rZqG27iOtlWpSL1b1v9QtijOFWf6w',
    },
    {
      id: '4',
      name: 'Thai Spice',
      cuisine: 'Thai, Asian',
      rating: 4.6,
      deliveryTime: '30-40 min',
      priceRange: '$$',
      imageUrl:
        'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: '5',
      name: 'Tapas & Wine',
      cuisine: 'Spanish, Tapas',
      rating: 4.7,
      deliveryTime: '40-50 min',
      priceRange: '$$$',
      imageUrl:
        'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: '6',
      name: 'Green Garden',
      cuisine: 'Vegetarian, Healthy, Salad',
      rating: 4.8,
      deliveryTime: '20-30 min',
      priceRange: '$$',
      imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    },
  ];

  searchRestaurants(query: string): Restaurant[] {
    if (!query || !query.trim()) {
      return this.restaurants;
    }

    const lowerQuery = query.toLowerCase();

    // Simple filter logic
    return this.restaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(lowerQuery) ||
        restaurant.cuisine.toLowerCase().includes(lowerQuery),
    );
  }

  getMenu(restaurantId: string, category: string) {
    // Mock menu items
    const allItems = [
      {
        id: '1',
        name: 'Smash Clásica',
        description: 'Hamburguesa smash jugosa con queso y lechuga.',
        price: 12.99,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBPeg5O0gLcFV-kcdU_N7kjif9basfHcJn8sUZfbJivZmbtR-hSnHGupClZ-d4bhCewBvtKPCtT_AYQCWnKYhzxF3_WfKpiDf1C3QlY8fUW9yS-laG9uG3C-TsBZxoHGY-dyji4R0wlnTgvLSQ0k-aLV9QVvwdDapHSWKtDq1hMjWTJtUmnfUF7PM9z0cPr-UMBLEvokHsmU96e5NyYP9JXoVTM8fUmlvwvnucj-R59fkjmcNxsEAaqCo5W0AA5HB5he3h2IPgNbmE',
        category: 'mains',
        tags: ['Smashed', 'Popular'],
      },
      {
        id: '2',
        name: 'Setas Trufada',
        description: 'Hamburguesa gourmet de setas y queso suizo con glaseado de trufa.',
        price: 15.5,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCCFhGR5pfdPIHc-Xdd_nmrZS_Gjes8qFwiu5n9iXOAVUipvoH1wlM0bXh3jY1-aDRq6boKldhNJCrifGuPH9Vikf-nxlxKSw7rJpPwcQjMOiAyvEMFNlXYQVamkeExJuX8xpvv5tBtUFdeIf4zKeRH73Y7bC2II42INOKTCRaBHrXRC6X8NX0hdjrUzJ5Zoy0JQU8Q4cpynPIheM5pv2tSnCGInIQAnXlzFdji4-QkW7NhBLuuhrSvsyjn8ETxJZaHlgljYGMkG9U',
        category: 'mains',
        tags: ['Sin Cebolla', 'Mejor Valorada'],
      },
      {
        id: '3',
        name: 'Calamares Crujientes',
        description: 'Calamares fritos ligeros con salsa marinera.',
        price: 9.99,
        imageUrl:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'starters',
        tags: ['Crujiente'],
      },
      {
        id: '4',
        name: 'Ensalada César',
        description: 'Lechuga romana fresca con parmesano y picatostes.',
        price: 8.5,
        imageUrl:
          'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'starters',
        tags: ['Saludable'],
      },
      {
        id: '5',
        name: 'Coulant de Chocolate',
        description: 'Pastel de chocolate rico con centro fundido.',
        price: 7.99,
        imageUrl:
          'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'desserts',
        tags: ['Dulce'],
      },
      {
        id: '6',
        name: 'Refresco',
        description: 'Elección de Cola, Sprite o Fanta.',
        price: 2.5,
        imageUrl:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'drinks',
        tags: ['Frío'],
      },
    ];

    if (category) {
      return allItems.filter((i) => i.category === category);
    }
    return allItems;
  }
}
