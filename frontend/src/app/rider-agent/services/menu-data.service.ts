import { Injectable } from "@angular/core";
import { CartItem } from "../../shared/services/cart.service";

export interface MenuCard extends CartItem {
  bestValue?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class MenuDataService {
  getCardsForCuisine(type: string, category = "popular"): MenuCard[] {
    // Helper to use local assets
    const img = (filename: string) => `assets/food_images/${filename}`;

    if (type.includes("japan") || type.includes("sushi")) {
      if (category === "starters") {
        return [
          {
            name: "Edamame",
            price: 4.5,
            image: img("edamame.webp"),
            tags: ["japan", "starter", "Healthy"],
            description: "Habas de soja al vapor con sal.",
          },
          {
            name: "Gyoza",
            price: 6.0,
            image: img("gyoza.webp"),
            tags: ["japan", "starter", "Hot"],
            description: "Empanadillas de carne y verduras.",
          },
          {
            name: "Sopa Miso",
            price: 3.5,
            image: img("miso_soup.webp"),
            tags: ["japan", "starter", "Warm"],
            description: "Sopa tradicional con tofu y algas.",
          },
        ];
      }
      if (
        category === "mains" ||
        category === "menu" ||
        category === "added_starter" ||
        category === "added_main"
      ) {
        return [
          {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: img("sushi_set.webp"),
            tags: ["japan", "sushi", "main", "Premium"],
            description: "Variado de 12 piezas de Nigiris y Makis.",
          },
          {
            name: "Katsu Curry",
            price: 14.0,
            image: img("katsu_curry.webp"),
            tags: ["japan", "main", "Hot"],
            description: "Curry japonés con cerdo empanado y arroz.",
          },
          {
            name: "Bento Box",
            price: 16.5,
            image: img("bento_box.webp"),
            tags: ["japan", "main", "Value"],
            description: "Caja completa con arroz, pollo y guarnición.",
          },
        ];
      }
      if (category === "kids") {
        return [
          {
            name: "Chicken Teriyaki Bowl",
            price: 9.5,
            image: img("chicken_teriyaki.webp"),
            tags: ["Kids"],
            description: "Pollo a la parrilla con salsa dulce y arroz.",
          },
          {
            name: "Cucumber Roll",
            price: 5.5,
            image: img("cucumber_roll.webp"),
            tags: ["Mild"],
            description: "Rollitos sencillos de pepino.",
          },
          {
            name: "Mini Ramen",
            price: 8.0,
            image: img("mini_ramen.webp"),
            tags: ["Warm"],
            description: "Pequeña porción de sopa de fideos.",
          },
          {
            name: "Edamame",
            price: 4.0,
            image: img("edamame.webp"),
            tags: ["Healthy"],
            description: "Habas de soja al vapor.",
          },
          {
            name: "Tamago Sushi",
            price: 4.5,
            image: img("tamago_sushi.webp"),
            tags: ["Sweet"],
            description: "Tortilla dulce sobre arroz.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Mochi Ice Cream",
            price: 6.5,
            image: img("mochi.webp"),
            tags: ["Sweet"],
            description: "Pastel de arroz relleno de helado.",
          },
          {
            name: "Matcha Cheesecake",
            price: 7.5,
            image: img("matcha_cheesecake.webp"),
            tags: ["Creamy"],
            description: "Tarta de queso con té verde.",
          },
          {
            name: "Dorayaki",
            price: 5.5,
            image: img("dorayaki.webp"),
            tags: ["Classic"],
            description: "Sándwich de tortitas con judía roja.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Volcano Roll",
            price: 15.0,
            image: img("volcano_roll.webp"),
            tags: ["Hot", "Spicy"],
            description: "Roll de atún con salsa picante.",
          },
          {
            name: "Spicy Ramen",
            price: 13.5,
            image: img("spicy_ramen.webp"),
            tags: ["Hot"],
            description: "Caldo rico con aceite de chile.",
          },
          {
            name: "Dynamite Roll",
            price: 14.5,
            image: img("dynamite_roll.webp"),
            tags: ["Spicy"],
            description: "Tempura de gamba con mayonesa picante.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Asahi Beer",
            price: 6.0,
            image: img("asahi.webp"),
            tags: ["japan", "drink", "Alcohol"],
            description: "Cerveza japonesa refrescante.",
          },
          {
            name: "Sake Caliente",
            price: 8.5,
            image: img("sake.webp"),
            tags: ["japan", "drink", "Warm"],
            description: "Vino de arroz tradicional.",
          },
          {
            name: "Ramune",
            price: 4.0,
            image: img("ramune.webp"),
            tags: ["japan", "drink", "Soda"],
            description: "Refresco japonés con canica.",
          },
        ];
      }
      return [
        {
          name: "Salmon Nigiri Set",
          price: 14.5,
          image: img("salmon_nigiri.webp"),
          tags: ["Fresh", "Best Seller"],
          bestValue: true,
          description: "Salmón fresco sobre arroz sazonado.",
        },
        {
          name: "Spicy Tuna Roll",
          price: 11.0,
          image: img("spicy_tuna.webp"),
          tags: ["Spicy"],
          description: "Atún con mayonesa picante y pepino.",
        },
        {
          name: "Dragon Roll",
          price: 16.0,
          image: img("dragon_roll.webp"),
          tags: ["Chef's Pick"],
          description: "Anguila y pepino cubierto de aguacate.",
        },
        {
          name: "Miso Soup",
          price: 4.5,
          image: img("miso_soup.webp"),
          tags: ["Warm"],
          description: "Sopa tradicional de soja con tofu.",
        },
        {
          name: "Tempura Udon",
          price: 13.5,
          image: img("tempura_udon.webp"),
          tags: ["Hot"],
          description: "Fideos gruesos en caldo con tempura.",
        },
      ];
    } else if (type.includes("italian") || type.includes("pizza")) {
      if (category === "kids") {
        return [
          {
            name: "Mini Margherita",
            price: 8.5,
            image: img("mini_margherita.webp"),
            tags: ["Kids"],
            description: "Pequeña pizza de queso y tomate.",
          },
          {
            name: "Spaghetti Bambino",
            price: 9.0,
            image: img("spaghetti_bambino.webp"),
            tags: ["Mild"],
            description: "Pasta con salsa suave de tomate.",
          },
          {
            name: "Macarrones Queso",
            price: 9.5,
            image: img("mac_cheese.webp"),
            tags: ["Cheesy"],
            description: "Pasta con mucha salsa de queso.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Chianti Classico",
            price: 7.0,
            image: img("chianti.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Vino tinto de la Toscana.",
          },
          {
            name: "Peroni Nastro",
            price: 5.0,
            image: img("peroni.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Cerveza italiana premium.",
          },
          {
            name: "Limoncello",
            price: 4.5,
            image: img("limoncello.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Licor de limón refrescante.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Tiramisu",
            price: 8.0,
            image: img("tiramisu.webp"),
            tags: ["italian", "dessert", "Dessert"],
            description: "Postre italiano con café y mascarpone.",
          },
          {
            name: "Panna Cotta",
            price: 7.5,
            image: img("panna_cotta.webp"),
            tags: ["italian", "dessert", "Creamy"],
            description: "Crema de nata con frutos rojos.",
          },
          {
            name: "Cannoli",
            price: 6.0,
            image: img("cannoli.webp"),
            tags: ["italian", "dessert", "Crispy"],
            description: "Masa frita rellena de ricotta dulce.",
          },
        ];
      }
      return [
        {
          name: "Margherita Pizza",
          price: 13.9,
          image: img("pizza_margherita.webp"),
          tags: ["italian", "main", "Vegetarian"],
          description: "Tomate, mozzarella y albahaca fresca.",
        },
        {
          name: "Carbonara",
          price: 15.5,
          image: img("carbonara.webp"),
          tags: ["italian", "main", "Creamy"],
          description: "Pasta con huevo, queso pecorino y guanciale.",
        },
        {
          name: "Lasagna",
          price: 16.0,
          image: img("lasagna.webp"),
          tags: ["italian", "main", "Hearty"],
          description: "Capas de pasta con salsa de carne y bechamel.",
        },
        {
          name: "Risotto Funghi",
          price: 18.0,
          image: img("risotto_funghi.webp"),
          tags: ["italian", "main", "Creamy"],
          description: "Arroz cremoso con selección de setas.",
        },
      ];
    } else if (type.includes("spanish")) {
      if (category === "kids") {
        return [
          {
            name: "Tortilla Francesa",
            price: 5.0,
            image: img("tortilla_francesa.webp"),
            tags: ["Kids"],
            description: "Tortilla simple con pan.",
          },
          {
            name: "Croquetas de Jamón",
            price: 8.0,
            image: img("croquetas.webp"),
            tags: ["Classic"],
            description: "Croquetas caseras cremosas.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Patatas Bravas",
            price: 6.5,
            image: img("patatas_bravas.webp"),
            tags: ["Spicy", "Tapas"],
            description: "Patatas fritas con salsa picante.",
          },
          {
            name: "Chorizo a la Sidra",
            price: 9.0,
            image: img("chorizo_sidra.webp"),
            tags: ["Spicy", "Hot"],
            description: "Chorizo cocido en sidra natural.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Vino Rioja",
            price: 4.5,
            image: img("vino_rioja.webp"),
            tags: ["spanish", "drink", "Alcohol"],
            description: "Copa de vino tinto.",
          },
          {
            name: "Cerveza",
            price: 3.5,
            image: img("cerveza.webp"),
            tags: ["spanish", "drink", "Alcohol", "Cold"],
            description: "Caña de cerveza rubia.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Crema Catalana",
            price: 6.0,
            image: img("crema_catalana.webp"),
            tags: ["spanish", "dessert", "Sweet"],
            description: "Crema pastelera con azúcar quemado.",
          },
          {
            name: "Churros",
            price: 6.5,
            image: img("churros.webp"),
            tags: ["spanish", "dessert", "Sweet"],
            description: "Masa frita con chocolate caliente.",
          },
        ];
      }
      return [
        {
          name: "Jamón Ibérico",
          price: 22.0,
          image: img("jamon_iberico.webp"),
          tags: ["spanish", "main", "Premium"],
          description: "Jamón curado de bellota cortado a mano.",
        },
        {
          name: "Patatas Bravas",
          price: 8.5,
          image: img("patatas_bravas.webp"),
          tags: ["spanish", "main", "Spicy"],
          description: "Patatas fritas con salsa picante.",
        },
        {
          name: "Paella Mixta",
          price: 18.0,
          image: img("paella.webp"),
          tags: ["spanish", "main", "Classic"],
          description: "Arroz con marisco y pollo.",
        },
        {
          name: "Tortilla Española",
          price: 9.0,
          image: img("tortilla_espanola.webp"),
          tags: ["spanish", "main", "Vegetarian"],
          description: "Tortilla de patatas y huevo.",
        },
        {
          name: "Croquetas",
          price: 10.0,
          image: img("croquetas.webp"),
          tags: ["spanish", "tapas"],
          description: "Bechamel cremosa con jamón frita.",
        },
      ];
    } else {
      // Burgers / Fast Food / Chicken
      if (category === "kids") {
        return [
          {
            name: "Kids Burger",
            price: 7.99,
            image: img("kids_burger.webp"),
            tags: ["Kids"],
            description: "Hamburguesa sencilla con ketchup.",
          },
          {
            name: "Mac & Cheese",
            price: 6.99,
            image: img("mac_cheese.webp"),
            tags: ["Cheesy"],
            description: "Macarrones con salsa de queso.",
          },
          {
            name: "Nuggets",
            price: 6.5,
            image: img("nuggets.webp"),
            tags: ["Crunchy"],
            description: "Trocitos de pollo empanado.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Diablo Burger",
            price: 14.99,
            image: img("diablo_burger.webp"),
            tags: ["Hot"],
            description: "Con chiles jalapeños y salsa picante.",
          },
          {
            name: "Spicy Wings",
            price: 11.99,
            image: img("spicy_wings.webp"),
            tags: ["Hot"],
            description: "Alitas bañadas en salsa buffalo.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Cola",
            price: 3.0,
            image: img("cola.webp"),
            tags: ["fast_food", "drink", "Soda", "Cold"],
            description: "Refresco de cola con hielo.",
          },
          {
            name: "Batido de Fresa",
            price: 4.5,
            image: img("strawberry_shake.webp"),
            tags: ["fast_food", "drink", "Sweet", "Cold"],
            description: "Batido cremoso de fresa.",
          },
          {
            name: "Agua Mineral",
            price: 2.0,
            image: img("mineral_water.webp"),
            tags: ["fast_food", "drink", "Water"],
            description: "Agua mineral natural.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Helado Sundae",
            price: 4.5,
            image: img("sundae.webp"),
            tags: ["fast_food", "dessert", "Cold"],
            description: "Helado de vainilla con sirope.",
          },
          {
            name: "Brownie",
            price: 5.0,
            image: img("brownie.webp"),
            tags: ["fast_food", "dessert", "Sweet"],
            description: "Bizcocho de chocolate templado.",
          },
        ];
      }

      // -- NEW CATEGORIES --
      if (category === "menu_chicken") {
        return [
          {
            name: "Chicken Wings",
            price: 10.99,
            image: img("chicken_wings.webp"),
            tags: ["fast_food", "chicken", "main", "Fried"],
            description: "Alitas de pollo crujientes.",
          },
          {
            name: "Crispy Chicken Sandwich",
            price: 11.5,
            image: img("chicken_sandwich.webp"),
            tags: ["fast_food", "chicken", "main", "Popular"],
            description: "Sandwich de pollo frito.",
          },
          {
            name: "Chicken Tenders",
            price: 9.99,
            image: img("nuggets.webp"),
            tags: ["fast_food", "chicken", "main"],
            description: "Tiras de pollo rebozadas.",
          },
        ];
      }

      return [
        {
          name: "Classic Cheeseburger",
          price: 12.99,
          image: img("classic_burger.webp"),
          tags: ["fast_food", "main", "Top Rated"],
          bestValue: true,
          description: "Carne de vacuno con queso cheddar fundido.",
        },
        {
          name: "Bacon BBQ Stack",
          price: 15.5,
          image: img("bacon_burger.webp"),
          tags: ["fast_food", "main", "Smoky"],
          description: "Con salsa barbacoa y cebolla crujiente.",
        },
        {
          name: "Chicken Royale",
          price: 13.5,
          image: img("chicken_burger.webp"),
          tags: ["fast_food", "main", "Crispy"],
          description: "Pechuga de pollo crujiente con mayonesa.",
        },
        {
          name: "Veggie Delight",
          price: 11.99,
          image: img("veggie_burger.webp"),
          tags: ["fast_food", "main", "Vegetarian"],
          description: "Hamburguesa vegetal con aguacate.",
        },
        {
          name: "Loaded Fries",
          price: 8.99,
          image: img("loaded_fries.webp"),
          tags: ["fast_food", "side", "Shareable"],
          description: "Patatas con queso, bacon y salsa ranchera.",
        },
      ];
    }
  }
}
