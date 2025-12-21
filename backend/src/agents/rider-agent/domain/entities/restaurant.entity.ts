export class Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  imageUrl: string;
  menuItems?: MenuItem[];
}

export class MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
}
