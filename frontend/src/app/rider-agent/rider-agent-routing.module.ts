import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MobileLayoutComponent } from "../abandoned-cart/components/mobile-layout/mobile-layout.component";
import { SuperAppHomeComponent } from "./components/super-app-home/super-app-home.component";
import { AiConciergeComponent } from "./components/ai-concierge/ai-concierge.component";
import { SearchResultsComponent } from "./components/search-results/search-results.component";
import { RestaurantDetailsComponent } from "./components/restaurant-details/restaurant-details.component";

const routes: Routes = [
  {
    path: "",
    component: MobileLayoutComponent,
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./components/onboarding/onboarding.component").then(
            (m) => m.OnboardingComponent
          ),
      },
      { path: "home", component: SuperAppHomeComponent },
      {
        path: "chat",
        loadComponent: () =>
          import("./components/ai-menu-chat/ai-menu-chat.component").then(
            (m) => m.AiMenuChatComponent
          ),
      },
      { path: "search", component: SearchResultsComponent },
      {
        path: "checkout",
        loadComponent: () =>
          import("./components/checkout/checkout.component").then(
            (m) => m.CheckoutComponent
          ),
      },
      {
        path: "restaurant/:id",
        loadComponent: () =>
          import("./components/ai-menu-chat/ai-menu-chat.component").then(
            (m) => m.AiMenuChatComponent
          ),
      },
      {
        path: "reservations",
        loadComponent: () =>
          import("./components/reservations/reservations.component").then(
            (m) => m.ReservationsComponent
          ),
      },
      {
        path: "tracking",
        loadComponent: () =>
          import("./components/order-tracking/order-tracking.component").then(
            (m) => m.OrderTrackingComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RiderAgentRoutingModule {}
