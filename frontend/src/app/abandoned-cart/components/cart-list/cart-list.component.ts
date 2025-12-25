import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  HostListener,
} from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { AbandonedCartService } from "../../services/abandoned-cart.service";
import { Cart, CartStatus } from "../../models/cart.model";

// Export CartStatus for template
export { CartStatus };

/**
 * Cart List Component
 *
 * Displays list of abandoned carts with filters and actions
 */
@Component({
  selector: "app-cart-list",
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  templateUrl: "./cart-list.component.html",
  styleUrl: "./cart-list.component.scss",
})
export class CartListComponent implements OnInit {
  private readonly cartService = inject(AbandonedCartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  allCarts = signal<Cart[]>([]);
  loading = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  toastMessage = signal<string | null>(null);
  searchTerm = signal<string>("");
  selectedCarts = signal<Set<string>>(new Set());
  activeFilter = signal<string>("all");
  sortBy = signal<"value" | "date" | "probability">("date");
  sortOrder = signal<"asc" | "desc">("desc");
  statusFilter = signal<string>("all");
  showStatusDropdown = signal<boolean>(false);
  showNotificationsDropdown = signal<boolean>(false);

  // Computed filtered and sorted carts
  carts = computed(() => {
    let filtered = [...this.allCarts()];

    // Search filter
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter((cart) => {
        const name = cart.customer?.name?.toLowerCase() || "";
        const email = cart.customer?.email?.toLowerCase() || "";
        const company = cart.customer?.company?.toLowerCase() || "";
        const productNames = cart.items
          .map((item) => item.name.toLowerCase())
          .join(" ");
        return (
          name.includes(search) ||
          email.includes(search) ||
          company.includes(search) ||
          productNames.includes(search)
        );
      });
    }

    // Status filter
    if (this.statusFilter() !== "all") {
      filtered = filtered.filter(
        (cart) => cart.status === (this.statusFilter() as CartStatus)
      );
    }

    // Date filter (today)
    if (this.activeFilter() === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((cart) => {
        const cartDate = new Date(cart.lastModifiedAt);
        cartDate.setHours(0, 0, 0, 0);
        return cartDate.getTime() === today.getTime();
      });
    }

    // Value filter (> $500)
    if (this.activeFilter() === "value") {
      filtered = filtered.filter((cart) => cart.totalValue > 500);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy()) {
        case "value":
          comparison = a.totalValue - b.totalValue;
          break;
        case "date":
          comparison =
            new Date(a.lastModifiedAt).getTime() -
            new Date(b.lastModifiedAt).getTime();
          break;
        case "probability":
          comparison =
            (a.recoveryProbability || 0) - (b.recoveryProbability || 0);
          break;
      }
      return this.sortOrder() === "asc" ? comparison : -comparison;
    });

    return filtered;
  });

  ngOnInit(): void {
    // Read query params
    this.route.queryParams.subscribe((params) => {
      if (params["filter"] === "today") {
        this.activeFilter.set("today");
      }
      if (params["status"]) {
        this.statusFilter.set(params["status"] as CartStatus);
      }
      if (params["sort"]) {
        this.sortBy.set(params["sort"] as "value" | "date" | "probability");
        this.sortOrder.set(params["order"] || "desc");
      }
    });

    this.loadCarts();
  }

  private loadCarts(): void {
    this.loading.set(true);
    this.cartService.getAbandonedCarts().subscribe({
      next: (carts) => {
        this.allCarts.set(this.withRandomStatuses(carts));
        this.loading.set(false);
      },
      error: () => {
        // Error loading - carts will be empty
        this.allCarts.set([]);
        this.loading.set(false);
      },
    });
  }

  toggleSelection(cartId: string): void {
    const selected = new Set(this.selectedCarts());
    if (selected.has(cartId)) {
      selected.delete(cartId);
    } else {
      selected.add(cartId);
    }
    this.selectedCarts.set(selected);
  }

  recoverCart(cartId: string): void {
    const carts = [...this.allCarts()];
    const idx = carts.findIndex((c) => c.id === cartId);
    if (idx === -1) return;

    const cart = carts[idx];

    // Update cart status to RECOVERED
    carts[idx] = {
      ...cart,
      status: CartStatus.RECOVERED,
      recoveryAttempts: (cart.recoveryAttempts || 0) + 1,
      lastModifiedAt: new Date(),
    };

    this.allCarts.set(carts);
    this.showToast(
      `✅ Carrito de ${
        cart.customer?.name || "cliente"
      } recuperado exitosamente`
    );
  }

  viewOrder(cartId: string): void {
    // Navigate to cart detail page
    this.router.navigate(["/abandoned-cart", cartId]);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    } else {
      return "Hace poco";
    }
  }

  getProbabilityClass(probability: number): string {
    if (probability >= 70) return "high";
    if (probability >= 40) return "medium";
    return "low";
  }

  getCustomerInfo(cart: Cart): string {
    if (!cart.customer) {
      return "";
    }
    const parts: string[] = [];
    if (cart.customer.company) {
      parts.push(cart.customer.company);
    }
    if (cart.customer.email) {
      parts.push(cart.customer.email);
    }
    return parts.join(" • ");
  }

  getCustomerAvatar(cart: Cart): string {
    if (cart.customer?.imageUrl) {
      return cart.customer.imageUrl;
    }
    // Use mock photos from pravatar.cc based on customer ID for consistency
    const seed =
      cart.customerId || cart.id || Math.random().toString(36).substring(7);
    // Generate a consistent number from the seed
    const seedNumber = seed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avatarId = (seedNumber % 70) + 1; // Use IDs 1-70 for variety
    return `https://i.pravatar.cc/150?img=${avatarId}`;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Fallback a un avatar por defecto si la imagen falla
    const fallbackId = Math.floor(Math.random() * 70) + 1;
    img.src = `https://i.pravatar.cc/150?img=${fallbackId}`;
    // Si aún falla, usar un placeholder simple
    img.onerror = () => {
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPHBhdGggZD0iTTIwIDEyQzIyLjIwOTEgMTIgMjQgMTMuNzkwOSAyNCAxNkMyNCAxOC4yMDkxIDIyLjIwOTEgMjAgMjAgMjBDMTcuNzkwOSAyMCAxNiAxOC4yMDkxIDE2IDE2QzE2IDEzLjc5MDkgMTcuNzkwOSAxMiAyMCAxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDIyQzE1LjU4MTcgMjIgMTIgMjQuNTgxNyAxMiAyOVYzMkgyOFYyOUMyOCAyNC41ODE3IDI0LjQxODMgMjIgMjAgMjJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=";
    };
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.showStatusDropdown.set(false);
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown.set(!this.showStatusDropdown());
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "all":
        return "Estado";
      case "ABANDONED":
        return "Abandonados";
      case "RECOVERED":
        return "Recuperados";
      default:
        return "Estado";
    }
  }

  isRecoveredView = computed(() => this.statusFilter() === "RECOVERED");

  getHeaderTitle = computed(() => {
    return this.isRecoveredView()
      ? "Ingresos Recuperados"
      : "Carritos Abandonados";
  });

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".status-dropdown-container")) {
      this.showStatusDropdown.set(false);
    }
    if (!target.closest(".notifications-dropdown-container")) {
      this.showNotificationsDropdown.set(false);
    }
  }

  toggleNotificationsDropdown(): void {
    this.showNotificationsDropdown.set(!this.showNotificationsDropdown());
  }

  getMockNotifications(): {
    id: string;
    message: string;
    time: string;
    read: boolean;
  }[] {
    return [
      {
        id: "1",
        message: "Nuevo carrito abandonado de Juan Pérez",
        time: "Hace 5 min",
        read: false,
      },
      {
        id: "2",
        message: "Carrito recuperado exitosamente - $1,240",
        time: "Hace 1 hora",
        read: false,
      },
      {
        id: "3",
        message: "3 carritos necesitan seguimiento",
        time: "Hace 2 horas",
        read: true,
      },
    ];
  }

  goBack(): void {
    window.history.back();
  }

  loadMoreCarts(): void {
    this.loadingMore.set(true);
    setTimeout(() => {
      const extra = Array.from({ length: 3 }).map((_, i) =>
        this.generateMockCart(i)
      );
      this.allCarts.set(
        this.withRandomStatuses([...this.allCarts(), ...extra])
      );
      this.loadingMore.set(false);
      this.showToast("3 carritos añadidos");
    }, 400);
  }

  private generateMockCart(seed: number): Cart {
    const names = ["Sofía", "Diego", "Camila", "Mateo", "Valentina", "Andrés"];
    const products = [
      "Mochila",
      "Audífonos",
      "Teclado Mecánico",
      "Mouse Ergo",
      "Lámpara LED",
      'Monitor 27"',
    ];

    // Product images mapping
    const productImages: Record<string, string> = {
      Mochila:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop",
      Audífonos:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
      "Teclado Mecánico":
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&h=150&fit=crop",
      "Mouse Ergo":
        "https://images.unsplash.com/photo-1527814050087-3793815479db?w=150&h=150&fit=crop",
      "Lámpara LED":
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=150&h=150&fit=crop",
      'Monitor 27"':
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&h=150&fit=crop",
    };

    const name =
      names[(seed + Math.floor(Math.random() * names.length)) % names.length];
    const product =
      products[
        (seed + Math.floor(Math.random() * products.length)) % products.length
      ];
    const value = Number((Math.random() * 900 + 80).toFixed(2));

    // Random date generation logic
    let created = new Date(
      Date.now() - this.getRandomInt(1, 48) * 60 * 60 * 1000
    );
    // Force 30% of generateMockCart to be today (very recent)
    if (seed % 3 === 0) {
      created = new Date();
      created.setHours(new Date().getHours() - this.getRandomInt(0, 5));
    }

    return {
      id: `cart-extra-${Date.now()}-${seed}`,
      customerId: `customer-extra-${seed}`,
      customer: {
        id: `customer-extra-${seed}`,
        name: `${name} Demo`,
        email: `${name.toLowerCase()}@demo.com`,
        phoneNumber: "+34655555" + this.getRandomInt(100, 999),
        company: "Demo Corp",
      },
      items: [
        {
          productId: `prod-extra-${seed}`,
          name: product,
          quantity: 1,
          unitPrice: value,
          totalPrice: value,
          imageUrl:
            productImages[product] ||
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
        },
      ],
      totalValue: value,
      status: CartStatus.ABANDONED,
      createdAt: created,
      lastModifiedAt: created,
      recoveryAttempts: 0,
      recoveryProbability: this.getRandomInt(10, 95),
    };
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private withRandomStatuses(carts: Cart[]): Cart[] {
    // Solo usar estados relevantes: ABANDONED y RECOVERED
    // Asegurar que haya una mezcla de estados para que el filtro funcione
    return carts.map((cart, idx) => ({
      ...cart,
      // La mayoría serán abandonados, algunos recuperados
      // Usar el índice para asegurar que haya variedad
      status:
        idx % 4 === 0 || idx % 5 === 0
          ? CartStatus.RECOVERED
          : CartStatus.ABANDONED,
    }));
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2000);
  }
}
