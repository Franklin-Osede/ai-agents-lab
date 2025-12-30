export const DIALOGUES = {
  version: "1.0",
  start_state: { context: "general", category: "default" },
  states: [
    {
      id: "general.default",
      response:
        "¿Qué te apetece hoy: japonesa, italiana, fast food o española?",
      suggestions: [
        "🍣 Japonesa",
        "🍕 Italiana",
        "🍔 Fast Food",
        "🥘 Española",
      ],
      on_select: {
        "🍣 Japonesa": { context: "japanese", category: "default" },
        "🍕 Italiana": { context: "italian", category: "default" },
        "🍔 Fast Food": { context: "fast_food", category: "default" },
        "🥘 Española": { context: "spanish", category: "default" },
        "🛒 Ver pedido": { context: "general", category: "view_order" },
      },
      on_intent: {
        choose_cuisine_japanese: {
          context: "japanese",
          category: "default",
        },
        choose_cuisine_italian: {
          context: "italian",
          category: "default",
        },
        choose_cuisine_fast_food: {
          context: "fast_food",
          category: "default",
        },
        choose_cuisine_spanish: {
          context: "spanish",
          category: "default",
        },
        view_order: { context: "general", category: "view_order" },
      },
    },

    {
      id: "general.add_to_order",
      response:
        "Perfecto, lo añado a tu pedido. ¿Quieres algo más o finalizamos?",
      suggestions: ["➕ Seguir pidiendo", "🥤 Bebidas", "🍰 Postres", "✅ Finalizar"],
      on_select: {
        "➕ Seguir pidiendo": { context: "general", category: "default" },
        "🥤 Bebidas": { context: "general", category: "choose_drinks_context" },
        "🍰 Postres": { context: "general", category: "choose_dessert_context" },
        "✅ Finalizar": { context: "general", category: "confirm_order" },
      },
      on_intent: {
        continue_ordering: { context: "general", category: "default" },
        view_order: { context: "general", category: "view_order" },
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "general.view_order",
      response:
        "Aquí tienes tu pedido actual. ¿Confirmamos o quieres cambiar algo?",
      suggestions: ["✅ Confirmar", "➕ Seguir pidiendo"],
      on_select: {
        "✅ Confirmar": { context: "general", category: "confirm_order" },
        "➕ Seguir pidiendo": { context: "general", category: "default" },
      },
      on_intent: {
        confirm_order: { context: "general", category: "confirm_order" },
        modify_order: { context: "general", category: "modify_order" },
        continue_ordering: { context: "general", category: "default" },
      },
    },

    {
      id: "general.confirm_order",
      response: "Genial. ¿A domicilio o Reservar Mesa?",
      suggestions: ["🏠 A domicilio", "📅 Reservar Mesa"],
      on_select: {
        "🏠 A domicilio": {
          context: "general",
          category: "delivery_action",
          set_memory: { delivery_method: "delivery" },
        },
        "📅 Reservar Mesa": {
          context: "general",
          category: "reservation_entry",
        },
      },
      on_intent: {
        choose_delivery: {
          context: "general",
          category: "delivery_action",
          set_memory: { delivery_method: "delivery" },
        },
        choose_reservation: {
          context: "general",
          category: "reservation_entry",
        },
      },
    },

    {
      id: "general.checkout",
      response: "Perfecto. Antes de pagar, ¿quieres añadir bebida o postre?",
      suggestions: ["🥤 Bebidas", "🍰 Postres", "✅ No, pagar", "⬅️ Volver"],
      on_select: {
        "🥤 Bebidas": {
          context: "general",
          category: "choose_drinks_context",
        },
        "🍰 Postres": {
          context: "general",
          category: "choose_dessert_context",
        },
        "✅ No, pagar": { context: "general", category: "payment" },
        "⬅️ Volver": { context: "general", category: "view_order" },
      },
      on_intent: {
        add_drinks: {
          context: "general",
          category: "choose_drinks_context",
        },
        add_dessert: {
          context: "general",
          category: "choose_dessert_context",
        },
        pay: { context: "general", category: "payment" },
      },
    },

    {
      id: "general.choose_drinks_context",
      response:
        "¿En qué cocina estás ahora para las bebidas: japonesa, italiana, fast food o española?",
      suggestions: [
        "🍣 Japonesa",
        "🍕 Italiana",
        "🍔 Fast Food",
        "🥘 Española",
        "⬅️ Volver",
      ],
      on_select: {
        "🍣 Japonesa": { context: "japanese", category: "drinks" },
        "🍕 Italiana": { context: "italian", category: "drinks" },
        "🍔 Fast Food": { context: "fast_food", category: "drinks" },
        "🥘 Española": { context: "spanish", category: "drinks" },
        "⬅️ Volver": { context: "general", category: "checkout" },
      },
    },

    {
      id: "general.choose_dessert_context",
      response:
        "¿De qué cocina quieres el postre: japonesa, italiana, fast food o española?",
      suggestions: [
        "🍣 Japonesa",
        "🍕 Italiana",
        "🍔 Fast Food",
        "🥘 Española",
        "⬅️ Volver",
      ],
      on_select: {
        "🍣 Japonesa": { context: "japanese", category: "dessert" },
        "🍕 Italiana": { context: "italian", category: "dessert" },
        "🍔 Fast Food": { context: "fast_food", category: "dessert" },
        "🥘 Española": { context: "spanish", category: "dessert" },
        "⬅️ Volver": { context: "general", category: "checkout" },
      },
    },

    {
      id: "japanese.default",
      response:
        "¿Por dónde empezamos? ¿Entrantes, principales o directamente sushi?",
      suggestions: [
        "🥗 Entrantes",
        "🍣 Principales / Sushi",
        "🍜 Ramen",
        "🥤 Bebidas",
        "🏷️ Ver Variedades",
      ],
      on_select: {
        "🥗 Entrantes": { context: "japanese", category: "starters" },
        "🍣 Principales / Sushi": { context: "japanese", category: "mains" },
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" }, // Keep legacy ramen
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
        "🏷️ Ver Variedades": { context: "japanese", category: "menu" }, // Legacy menu
      },
    },

    {
      id: "japanese.starters",
      response:
        "Aquí tienes nuestros entrantes más populares. Haz clic en el que te apetezca.",
      suggestions: ["✅ Ya lo tengo todo"],
      on_select: {
        Edamame: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Edamame",
            price: 4.5,
            image: "assets/food_images/edamame.webp",
          }, // Simple mock item injection
        },
        Gyoza: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Gyoza",
            price: 6.0,
            image: "assets/food_images/gyoza.webp",
          },
        },
        "Sopa Miso": {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Sopa Miso",
            price: 3.5,
            image: "assets/food_images/miso_soup.webp",
          },
        },
        "🍣 Principales / Sushi": { context: "japanese", category: "mains" },
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" },
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
        "🍰 Postres": { context: "japanese", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "japanese.added_starter",
      response:
        "¡Añadido! 👌 ¿Pasamos a los platos principales, sushi o has terminado?",
      suggestions: ["🍣 Ver Principales", "🍜 Ramen", "✅ Ya lo tengo todo"],
      on_select: {
        Edamame: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Edamame",
            price: 4.5,
            image: "assets/food_images/edamame.webp",
          },
        },
        Gyoza: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Gyoza",
            price: 6.0,
            image: "assets/food_images/gyoza.webp",
          },
        },
        "Sopa Miso": {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Sopa Miso",
            price: 3.5,
            image: "assets/food_images/miso_soup.webp",
          },
        },
        "🍣 Ver Principales": { context: "japanese", category: "mains" },
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "japanese.mains",
      response: "Nuestra selección de Sushi y Platos calientes.",
      suggestions: [
        "🍣 Sushi Set",
        "🍛 Katsu Curry",
        "🍱 Bento Box",
        "✅ Ya lo tengo todo",
      ],
      on_select: {
        "Sushi Set Deluxe": {
          // Changed key to match card name usually, but keeping logic
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: "assets/food_images/sushi_set.webp",
          },
        },
        // Supporting old key just in case
        "Sushi Set": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: "assets/food_images/sushi_set.webp",
          },
        },
        "Katsu Curry": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Katsu Curry",
            price: 14.0,
            image: "assets/food_images/katsu_curry.webp",
          },
        },
        "🍛 Curry Japonés": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Katsu Curry",
            price: 14.0,
            image: "assets/food_images/katsu_curry.webp",
          },
        },
        "Bento Box": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Bento Box",
            price: 16.5,
            image: "assets/food_images/bento_box.webp",
          },
        },
        "🍱 Bento Box": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Bento Box",
            price: 16.5,
            image: "assets/food_images/bento_box.webp",
          },
        },
        "🥗 Entrantes": { context: "japanese", category: "starters" },
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
        "🍰 Postres": { context: "japanese", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "japanese.added_main",
      response:
        "¡Excelente elección! 😋 ¿Qué más te apetece? Puedes elegir entrantes, bebidas o postres.",
      suggestions: ["🥗 Entrantes", "🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"],
      on_select: {
        "Sushi Set Deluxe": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: "assets/food_images/sushi_set.webp",
          },
        },
        "Katsu Curry": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Katsu Curry",
            price: 14.0,
            image: "assets/food_images/katsu_curry.webp",
          },
        },
        "Bento Box": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Bento Box",
            price: 16.5,
            image: "assets/food_images/bento_box.webp",
          },
        },
        "🥗 Entrantes": { context: "japanese", category: "starters" },
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
        "🍰 Postres": { context: "japanese", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "japanese.menu",
      response:
        "En japonés tenemos sushi, ramen y platos calientes. ¿Qué te apetece?",
      suggestions: ["🍣 Sushi", "🍜 Ramen", "🔥 Platos calientes"],
      on_select: {
        "🍣 Sushi": { context: "japanese", category: "mains" }, // Redirects to new mains
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" },
        "🔥 Platos calientes": {
          context: "japanese",
          category: "menu_hot",
        },
      },
    },

    {
      id: "japanese.menu_ramen",
      response:
        "Ramen casero: Tonkotsu (cerdo) o Miso (vegetal). ¿Cuál prefieres?",
      suggestions: ["🍜 Tonkotsu", "🍜 Miso", "⬅️ Volver"],
      on_select: {
        "🍜 Tonkotsu": {
          context: "japanese",
          category: "added_main",
          add_item: { name: "Tonkotsu Ramen", tags: ["ramen", "japanese", "main"] },
        },
        "🍜 Miso": {
          context: "japanese",
          category: "added_main",
          add_item: { name: "Miso Ramen", tags: ["ramen", "japanese", "main"] },
        },
        "⬅️ Volver": { context: "japanese", category: "menu" },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "japanese.menu_hot",
      response:
        "Platos calientes deliciosos. ¿Katsu Curry, Bento Box o Yakisoba?",
      suggestions: [
        "🍛 Katsu Curry",
        "🍱 Bento Box",
        "🍝 Yakisoba",
        "⬅️ Volver",
      ],
      on_select: {
        "🍛 Katsu Curry": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Katsu Curry", tags: ["main", "japanese"] },
        },
        "🍱 Bento Box": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Bento Box", tags: ["main", "japanese"] },
        },
        "🍝 Yakisoba": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Yakisoba", tags: ["main", "japanese"] },
        },
        "⬅️ Volver": { context: "japanese", category: "menu" },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "japanese.kids",
      response:
        "Para peques: opciones suaves y fáciles. ¿Mini ramen o sushi de huevo?",
      suggestions: ["🍜 Mini Ramen", "🍣 Sushi de Huevo", "⬅️ Volver"],
      on_select: {
        "🍜 Mini Ramen": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Mini Ramen", tags: ["kids", "japanese"] },
        },
        "🍣 Sushi de Huevo": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Sushi de Huevo", tags: ["kids", "japanese"] },
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
    },

    {
      id: "japanese.spicy_level",
      response: "Modo picante 🌶️. ¿Nivel suave, medio o fuerte?",
      suggestions: ["🌶️ Suave", "🌶️🌶️ Medio", "🌶️🌶️🌶️ Fuerte", "⬅️ Volver"],
      on_select: {
        "🌶️ Suave": {
          context: "japanese",
          category: "spicy_pick",
          set_memory: { spicy_level: "mild" },
        },
        "🌶️🌶️ Medio": {
          context: "japanese",
          category: "spicy_pick",
          set_memory: { spicy_level: "medium" },
        },
        "🌶️🌶️🌶️ Fuerte": {
          context: "japanese",
          category: "spicy_pick",
          set_memory: { spicy_level: "hot" },
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
    },

    {
      id: "japanese.spicy_pick",
      response:
        "Perfecto. Te recomiendo Spicy Tuna o Ramen picante. ¿Cuál eliges?",
      suggestions: [
        "🍣 Spicy Tuna",
        "🍜 Ramen picante",
        "⬅️ Cambiar nivel",
        "⬅️ Volver",
      ],
      on_select: {
        "🍣 Spicy Tuna": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Spicy Tuna Roll",
            tags: ["spicy", "japanese"],
          },
        },
        "🍜 Ramen picante": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Ramen Picante", tags: ["spicy", "japanese"] },
        },
        "⬅️ Cambiar nivel": {
          context: "japanese",
          category: "spicy_level",
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
    },

    {
      id: "japanese.drinks",
      response:
        "Para beber: té matcha, refrescos japoneses o sake. ¿Con alcohol o sin alcohol?",
      suggestions: [
        "🥤 Ramune",
        "🍶 Con alcohol",
        "🍵 Sin alcohol",
        "✅ No, gracias",
      ],
      on_select: {
        "🥤 Ramune": {
          context: "japanese",
          category: "dessert",
          add_item: { name: "Ramune", tags: ["drink", "japanese"] },
        },
        "🍶 Con alcohol": {
          context: "japanese",
          category: "dessert",
          add_item: { name: "Sake", tags: ["drink", "japanese"] },
        },
        "🍵 Sin alcohol": {
          context: "japanese",
          category: "dessert",
          add_item: { name: "Té Matcha", tags: ["drink", "japanese"] },
        },
        "✅ No, gracias": { context: "japanese", category: "dessert" }, // Suggest dessert if skipping drinks
      },
    },

    {
      id: "japanese.dessert",
      response: "Para terminar, ¿un postre? Mochi es el favorito.",
      suggestions: ["🍡 Clásico", "🍵 Matcha", "✅ Finalizar Pedido"],
      on_select: {
        "🍡 Clásico": {
          context: "japanese",
          category: "added_main", // Loop back to 'added' so they can see order
          add_item: {
            name: "Mochi clásico",
            tags: ["dessert", "japanese"],
          },
        },
        "🍵 Matcha": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Mochi matcha",
            tags: ["dessert", "japanese"],
          },
        },
        "✅ Finalizar Pedido": { context: "general", category: "view_order" },
      },
    },

    {
      id: "italian.default",
      response:
        "Perfecto, italiana. ¿Menú normal, infantil, picante, bebidas o postres?",
      suggestions: [
        "🍝 Menú normal",
        "🧒 Infantil",
        "🌶️ Picante",
        "🥤 Bebidas",
        "🍰 Postres",
        "🛒 Ver pedido",
      ],
      on_select: {
        "🍝 Menú normal": { context: "italian", category: "menu" },
        "🧒 Infantil": { context: "italian", category: "kids" },
        "🌶️ Picante": { context: "italian", category: "spicy_level" },
        "🥤 Bebidas": { context: "italian", category: "drinks" },
        "🍰 Postres": { context: "italian", category: "dessert" },
        "🛒 Ver pedido": { context: "general", category: "view_order" },
      },
    },

    {
      id: "italian.menu",
      response:
        "En italiano tenemos pizzas al horno y pastas frescas. ¿Pizza o pasta?",
      suggestions: ["🍕 Pizza", "🍝 Pasta", "⬅️ Volver"],
      on_select: {
        "🍕 Pizza": { context: "italian", category: "menu_pizza" },
        "🍝 Pasta": { context: "italian", category: "menu_pasta" },
        "⬅️ Volver": { context: "italian", category: "default" },
      },
    },

    {
      id: "italian.menu_pizza",
      response: "Pizzas artesanales al horno. Elige tu favorita:",
      suggestions: [
        "🍕 Margherita",
        "🍕 Carbonara",
        "🍕 Cuatro Quesos",
        "⬅️ Volver",
      ],
      on_select: {
        "Margherita Pizza": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Margherita Pizza",
            price: 13.9,
            image: "assets/food_images/pizza_margherita.webp",
            tags: ["italian", "main", "pizza"],
          },
        },
        "Pizza Margherita": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Margherita Pizza",
            price: 13.9,
            image: "assets/food_images/pizza_margherita.webp",
            tags: ["italian", "main", "pizza"],
          },
        },
        "🍕 Margherita": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Margherita Pizza",
            price: 13.9,
            image: "assets/food_images/pizza_margherita.webp",
            tags: ["italian", "main", "pizza"],
          },
        },
        "⬅️ Volver": { context: "italian", category: "menu" },
      },
    },

    {
      id: "italian.menu_pasta",
      response: "Pastas frescas caseras. ¿Cuál prefieres?",
      suggestions: [
        "🍝 Carbonara",
        "🍝 Lasagna",
        "🍝 Risotto",
        "⬅️ Volver",
      ],
      on_select: {
        Carbonara: {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Carbonara",
            price: 15.5,
            image: "assets/food_images/carbonara.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "🍝 Carbonara": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Carbonara",
            price: 15.5,
            image: "assets/food_images/carbonara.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        Lasagna: {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Lasagna",
            price: 16.0,
            image: "assets/food_images/lasagna.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "🍝 Lasagna": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Lasagna",
            price: 16.0,
            image: "assets/food_images/lasagna.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "Risotto Funghi": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Risotto Funghi",
            price: 18.0,
            image: "assets/food_images/risotto_funghi.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "🍝 Risotto": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Risotto Funghi",
            price: 18.0,
            image: "assets/food_images/risotto_funghi.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "⬅️ Volver": { context: "italian", category: "menu" },
      },
    },

    {
      id: "italian.added_main",
      response:
        "¡Excelente elección! 😋 ¿Qué más te apetece? Puedes elegir entrantes, bebidas o postres.",
      suggestions: ["🥗 Entrantes", "🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"],
      on_select: {
        "Margherita Pizza": {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Margherita Pizza",
            price: 13.9,
            image: "assets/food_images/pizza_margherita.webp",
            tags: ["italian", "main", "pizza"],
          },
        },
        Carbonara: {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Carbonara",
            price: 15.5,
            image: "assets/food_images/carbonara.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        Lasagna: {
          context: "italian",
          category: "added_main",
          add_item: {
            name: "Lasagna",
            price: 16.0,
            image: "assets/food_images/lasagna.webp",
            tags: ["italian", "main", "pasta"],
          },
        },
        "🥗 Entrantes": { context: "italian", category: "starters" },
        "🥤 Bebidas": { context: "italian", category: "drinks" },
        "🍰 Postres": { context: "italian", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "italian.kids",
      response: "Para niños: pizza infantil o pasta suave. ¿Cuál prefieres?",
      suggestions: ["🍕 Pizza infantil", "🍝 Pasta suave", "⬅️ Volver"],
      on_select: {
        "🍕 Pizza infantil": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Pizza infantil", tags: ["kids", "italian"] },
        },
        "🍝 Pasta suave": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Pasta suave", tags: ["kids", "italian"] },
        },
        "⬅️ Volver": { context: "italian", category: "default" },
      },
    },

    {
      id: "italian.spicy_level",
      response: "¿Quieres un picante suave o fuerte?",
      suggestions: ["🌶️ Suave", "🌶️🌶️ Fuerte", "⬅️ Volver"],
      on_select: {
        "🌶️ Suave": {
          context: "italian",
          category: "spicy_pick",
          set_memory: { spicy_level: "mild" },
        },
        "🌶️🌶️ Fuerte": {
          context: "italian",
          category: "spicy_pick",
          set_memory: { spicy_level: "hot" },
        },
        "⬅️ Volver": { context: "italian", category: "default" },
      },
    },

    {
      id: "italian.spicy_pick",
      response:
        "Te recomiendo pasta Arrabbiata o pizza con salami picante. ¿Cuál eliges?",
      suggestions: [
        "🍝 Arrabbiata",
        "🍕 Salami picante",
        "⬅️ Cambiar",
        "⬅️ Volver",
      ],
      on_select: {
        "🍝 Arrabbiata": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Pasta Arrabbiata",
            tags: ["spicy", "italian"],
          },
        },
        "🍕 Salami picante": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Pizza salami picante",
            tags: ["spicy", "italian"],
          },
        },
        "⬅️ Cambiar": { context: "italian", category: "spicy_level" },
        "⬅️ Volver": { context: "italian", category: "default" },
      },
    },

    {
      id: "italian.drinks",
      response: "Para beber: vino, refresco o café. ¿Qué te apetece?",
      suggestions: ["🍷 Vino", "🥤 Refresco", "☕ Café"],
      on_select: {
        "🍷 Vino": {
          context: "italian",
          category: "dessert",
          add_item: { name: "Vino", tags: ["drink", "italian"] },
        },
        "🍺 Cerveza": {
          context: "italian",
          category: "dessert",
          add_item: { name: "Cerveza", tags: ["drink", "italian"] },
        },
        "🥤 Refresco": {
          context: "italian",
          category: "dessert",
          add_item: { name: "Refresco", tags: ["drink", "italian"] },
        },
        "☕ Café": {
          context: "italian",
          category: "dessert",
          add_item: { name: "Café", tags: ["drink", "italian"] },
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "italian.dessert",
      response: "Postres: Tiramisú casero. ¿Individual o para compartir?",
      suggestions: ["🍰 Individual", "👨‍👩‍👧‍👦 Compartir", "✅ Ya lo tengo todo"],
      on_select: {
        "🍰 Individual": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Tiramisú individual",
            tags: ["dessert", "italian"],
          },
        },
        "👨‍👩‍👧‍👦 Compartir": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Tiramisú para compartir",
            tags: ["dessert", "italian"],
          },
        },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "fast_food.default",
      response:
        "Perfecto, fast food. ¿Menú normal, infantil, picante, bebidas o postres?",
      suggestions: [
        "🍔 Menú normal",
        "🧒 Infantil",
        "🌶️ Picante",
        "🥤 Bebidas",
        "🍰 Postres",
        "🛒 Ver pedido",
      ],
      on_select: {
        "🍔 Menú normal": { context: "fast_food", category: "menu" },
        "🧒 Infantil": { context: "fast_food", category: "kids" },
        "🌶️ Picante": { context: "fast_food", category: "spicy_level" },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍰 Postres": { context: "fast_food", category: "dessert" },
        "🛒 Ver pedido": { context: "general", category: "view_order" },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "fast_food.menu",
      response: "Tenemos hamburguesas, pollo y acompañantes. ¿Qué te apetece?",
      suggestions: [
        "🍔 Hamburguesa",
        "🍗 Pollo",
        "🍟 Acompañantes",
        "⬅️ Volver",
      ],
      on_select: {
        "🍔 Hamburguesa": { context: "fast_food", category: "menu_burger" },
        "🍗 Pollo": { context: "fast_food", category: "menu_chicken" },
        "🍟 Acompañantes": { context: "fast_food", category: "menu_sides" },
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.kids",
      response:
        "Para peques: mini burger con queso o nuggets. ¿Cuál prefieres?",
      suggestions: ["🍔 Mini burger", "🍗 Nuggets", "⬅️ Volver"],
      on_select: {
        "🍔 Mini burger": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Mini burger", tags: ["kids", "fast_food"] },
        },
        "🍗 Nuggets": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Nuggets", tags: ["kids", "fast_food"] },
        },
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.spicy_level",
      response: "Modo picante 🌶️. ¿Nivel medio o muy fuerte?",
      suggestions: ["🌶️ Medio", "🌶️🌶️🌶️ Muy fuerte", "⬅️ Volver"],
      on_select: {
        "🌶️ Medio": {
          context: "fast_food",
          category: "spicy_pick",
          set_memory: { spicy_level: "medium" },
        },
        "🌶️🌶️🌶️ Muy fuerte": {
          context: "fast_food",
          category: "spicy_pick",
          set_memory: { spicy_level: "hot" },
        },
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.spicy_pick",
      response: "Te recomiendo Burger Diablo o alitas picantes. ¿Cuál eliges?",
      suggestions: [
        "🔥 Burger Diablo",
        "🍗 Alitas picantes",
        "⬅️ Cambiar",
        "⬅️ Volver",
      ],
      on_select: {
        "🔥 Burger Diablo": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Burger Diablo",
            tags: ["spicy", "fast_food"],
          },
        },
        "🍗 Alitas picantes": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Alitas picantes",
            tags: ["spicy", "fast_food"],
          },
        },
        "⬅️ Cambiar": { context: "fast_food", category: "spicy_level" },
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.drinks",
      response: "Para beber: refresco, batido o agua. ¿Qué quieres?",
      suggestions: ["🥤 Refresco", "🥛 Batido", "💧 Agua"],
      on_select: {
        "🥤 Refresco": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Refresco", tags: ["drink", "fast_food"] },
        },
        "🥛 Batido": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Batido", tags: ["drink", "fast_food"] },
        },
        "💧 Agua": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Agua", tags: ["drink", "fast_food"] },
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "fast_food.dessert",
      response: "Postres: helado o brownie. ¿Cuál te apetece?",
      suggestions: ["🍦 Helado", "🍫 Brownie"],
      on_select: {
        "🍦 Helado": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Helado", tags: ["dessert", "fast_food"] },
        },
        "🍫 Brownie": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Brownie", tags: ["dessert", "fast_food"] },
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "fast_food.menu_burger",
      response:
        "Aquí tienes nuestras mejores burgers. 🍔 Haz clic en la que más te guste.",
      suggestions: ["✅ Ya lo tengo todo"],
      on_select: {
        "Classic Smash": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Classic Smash",
            price: 12.99,
            image: "assets/food_images/burger_smash.webp",
          },
        },
        "Truffle Burger": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Truffle Burger",
            price: 15.5,
            image: "assets/food_images/burger_truffle.webp",
          },
        },
        "Bacon Cheese": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Bacon Cheese",
            price: 13.99,
            image: "assets/food_images/burger_bacon.webp",
          },
        },
        "🍗 Pollo": { context: "fast_food", category: "menu_chicken" },
        "🍟 Acompañantes": { context: "fast_food", category: "menu_sides" },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍰 Postres": { context: "fast_food", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.menu_chicken",
      response: "Pollo crujiente. 🍗 Elige tu favorito:",
      suggestions: ["⬅️ Volver"],
      on_select: {
        "Chicken Wings": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Wings",
            price: 10.99,
            image: "assets/food_images/chicken_wings.webp",
          },
        },
        "Crispy Chicken Sandwich": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Crispy Chicken Sandwich",
            price: 11.5,
            image: "assets/food_images/chicken_sandwich.webp",
          },
        },
        "Chicken Tenders": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Tenders",
            price: 9.99,
            image: "assets/food_images/chicken_tenders.webp",
          },
        },
        "🍔 Hamburguesas": { context: "fast_food", category: "menu_burger" },
        "🍟 Acompañantes": { context: "fast_food", category: "menu_sides" },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍰 Postres": { context: "fast_food", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.menu_sides",
      response: "Para acompañar... 🍟",
      suggestions: ["⬅️ Volver"],
      on_select: {
        Fries: {
          context: "fast_food",
          category: "added_side", // Redirect to same logic (added_main works generally)
          add_item: {
            name: "Fries",
            price: 4.99,
            image: "assets/food_images/fries.webp",
          },
        },
        "Onion Rings": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Onion Rings",
            price: 5.5,
            image: "assets/food_images/onion_rings.webp",
          },
        },
        "Caesar Salad": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Caesar Salad",
            price: 8.5,
            image: "assets/food_images/caesar_salad.webp",
          },
        },
        "🍔 Hamburguesas": { context: "fast_food", category: "menu_burger" },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍰 Postres": { context: "fast_food", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.added_main",
      response: "¡Añadido! 👌 ¿Algo más de comer o pasamos a la bebida?",
      suggestions: ["🥤 Bebidas", "🍟 Acompañantes", "✅ Ya lo tengo todo"],
      on_select: {
        "Classic Smash": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Classic Smash",
            price: 12.99,
            image: "assets/food_images/burger_smash.webp",
          },
        },
        "Truffle Burger": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Truffle Burger",
            price: 15.5,
            image: "assets/food_images/burger_truffle.webp",
          },
        },
        "Bacon Cheese": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Bacon Cheese",
            price: 13.99,
            image: "assets/food_images/burger_bacon.webp",
          },
        },
        "Chicken Wings": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Wings",
            price: 10.99,
            image: "assets/food_images/chicken_wings.webp",
          },
        },
        "Crispy Chicken Sandwich": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Crispy Chicken Sandwich",
            price: 11.5,
            image: "assets/food_images/chicken_sandwich.webp",
          },
        },
        "Chicken Tenders": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Tenders",
            price: 9.99,
            image: "assets/food_images/chicken_tenders.webp",
          },
        },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍟 Acompañantes": { context: "fast_food", category: "menu_sides" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },
    {
      id: "fast_food.added_side",
      response: "Acompañante listo. ¿Alguna bebida?",
      suggestions: ["🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"],
      on_select: {
        Fries: {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Fries",
            price: 4.99,
            image: "assets/food_images/fries.webp",
          },
        },
        "Onion Rings": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Onion Rings",
            price: 5.5,
            image: "assets/food_images/onion_rings.webp",
          },
        },
        "Caesar Salad": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Caesar Salad",
            price: 8.5,
            image: "assets/food_images/caesar_salad.webp",
          },
        },
        "🥤 Bebidas": { context: "fast_food", category: "drinks" },
        "🍰 Postres": { context: "fast_food", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },
    {
      id: "spanish.default",
      response:
        "Perfecto, española. ¿Menú normal, infantil, picante, bebidas o postres?",
      suggestions: [
        "🥘 Menú normal",
        "🧒 Infantil",
        "🌶️ Picante",
        "🥤 Bebidas",
        "🍰 Postres",
        "🛒 Ver pedido",
      ],
      on_select: {
        "🥘 Menú normal": { context: "spanish", category: "menu" },
        "🧒 Infantil": { context: "spanish", category: "kids" },
        "🌶️ Picante": { context: "spanish", category: "spicy_level" },
        "🥤 Bebidas": { context: "spanish", category: "drinks" },
        "🍰 Postres": { context: "spanish", category: "dessert" },
        "🛒 Ver pedido": { context: "general", category: "view_order" },
      },
    },

    {
      id: "spanish.menu",
      response: "Tenemos tapas y raciones. ¿Qué prefieres?",
      suggestions: ["🥘 Tapas", "🍽️ Raciones"],
      on_select: {
        "🥘 Tapas": { context: "spanish", category: "menu_tapas" },
        "🍽️ Raciones": { context: "spanish", category: "menu_raciones" },
      },
    },

    {
      id: "spanish.menu_tapas",
      response: "Aquí tienes nuestras tapas más populares. Elige la que más te apetezca:",
      suggestions: ["✅ Ya lo tengo todo"],
      on_select: {
        "Croquetas": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Croquetas",
            price: 10.0,
            image: "assets/food_images/croquetas.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "Patatas Bravas": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Patatas Bravas",
            price: 8.5,
            image: "assets/food_images/patatas_bravas.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "Tortilla Española": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Tortilla Española",
            price: 9.0,
            image: "assets/food_images/tortilla_espanola.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "spanish.menu_raciones",
      response: "Nuestras raciones más destacadas. Elige la que más te apetezca:",
      suggestions: ["✅ Ya lo tengo todo"],
      on_select: {
        "Jamón Ibérico": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Jamón Ibérico",
            price: 22.0,
            image: "assets/food_images/jamon_iberico.webp",
            tags: ["spanish", "raciones", "main"],
          },
        },
        "Paella Mixta": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Paella Mixta",
            price: 18.0,
            image: "assets/food_images/paella.webp",
            tags: ["spanish", "raciones", "main"],
          },
        },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "spanish.added_main",
      response:
        "¡Excelente elección! 😋 ¿Qué más te apetece?",
      suggestions: ["🥘 Más tapas", "🍽️ Raciones", "🥤 Bebidas", "🍰 Postres", "➕ Seguir pidiendo", "✅ Ya lo tengo todo"],
      on_select: {
        "🥘 Más tapas": { context: "spanish", category: "menu_tapas" },
        "🍽️ Raciones": { context: "spanish", category: "menu_raciones" },
        "➕ Seguir pidiendo": { context: "spanish", category: "menu" },
        "Jamón Ibérico": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Jamón Ibérico",
            price: 22.0,
            image: "assets/food_images/jamon_iberico.webp",
            tags: ["spanish", "raciones", "main"],
          },
        },
        "Paella Mixta": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Paella Mixta",
            price: 18.0,
            image: "assets/food_images/paella.webp",
            tags: ["spanish", "raciones", "main"],
          },
        },
        "Croquetas": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Croquetas",
            price: 10.0,
            image: "assets/food_images/croquetas.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "Patatas Bravas": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Patatas Bravas",
            price: 8.5,
            image: "assets/food_images/patatas_bravas.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "Tortilla Española": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Tortilla Española",
            price: 9.0,
            image: "assets/food_images/tortilla_espanola.webp",
            tags: ["spanish", "tapas", "main"],
          },
        },
        "🥤 Bebidas": { context: "spanish", category: "drinks" },
        "🍰 Postres": { context: "spanish", category: "dessert" },
        "✅ Ya lo tengo todo": {
          context: "general",
          category: "confirm_order",
        },
      },
    },

    {
      id: "spanish.kids",
      response: "Para peques: tortilla suave o croquetas. ¿Qué prefieres?",
      suggestions: ["🥔 Tortilla", "🧆 Croquetas"],
      on_select: {
        "🥔 Tortilla": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Tortilla", tags: ["kids", "spanish"] },
        },
        "🧆 Croquetas": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Croquetas", tags: ["kids", "spanish"] },
        },
      },
    },

    {
      id: "spanish.spicy_level",
      response: "Modo picante 🌶️. ¿Suave o fuerte?",
      suggestions: ["🌶️ Suave", "🌶️🌶️ Fuerte"],
      on_select: {
        "🌶️ Suave": {
          context: "spanish",
          category: "spicy_pick",
          set_memory: { spicy_level: "mild" },
        },
        "🌶️🌶️ Fuerte": {
          context: "spanish",
          category: "spicy_pick",
          set_memory: { spicy_level: "hot" },
        },
      },
    },

    {
      id: "spanish.spicy_pick",
      response: "Te recomiendo patatas bravas o chorizo picante. ¿Cuál eliges?",
      suggestions: [
        "🥔 Patatas bravas",
        "🌶️ Chorizo picante",
        "⬅️ Cambiar",
      ],
      on_select: {
        "🥔 Patatas bravas": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Patatas bravas",
            price: 8.5,
            image: "assets/food_images/patatas_bravas.webp",
            tags: ["spicy", "spanish", "main"],
          },
        },
        "🌶️ Chorizo picante": {
          context: "spanish",
          category: "added_main",
          add_item: {
            name: "Chorizo picante",
            price: 9.0,
            image: "assets/food_images/chorizo_sidra.webp",
            tags: ["spicy", "spanish", "main"],
          },
        },
        "⬅️ Cambiar": { context: "spanish", category: "spicy_level" },
      },
    },

    {
      id: "spanish.drinks",
      response: "Para beber: vino, cerveza o refresco. ¿Qué te pongo?",
      suggestions: ["🍷 Vino", "🍺 Cerveza", "🥤 Refresco"],
      on_select: {
        "🍷 Vino": {
          context: "spanish",
          category: "dessert",
          add_item: { name: "Vino", tags: ["drink", "spanish"] },
        },
        "🍺 Cerveza": {
          context: "spanish",
          category: "dessert",
          add_item: { name: "Cerveza", tags: ["drink", "spanish"] },
        },
        "🥤 Refresco": {
          context: "spanish",
          category: "dessert",
          add_item: { name: "Refresco", tags: ["drink", "spanish"] },
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "spanish.dessert",
      response:
        "Postres: churros con chocolate o crema catalana. ¿Cuál prefieres?",
      suggestions: ["🍩 Churros", "🍮 Crema catalana"],
      on_select: {
        "🍩 Churros": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Churros con chocolate",
            tags: ["dessert", "spanish"],
          },
        },
        "🍮 Crema catalana": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Crema catalana",
            tags: ["dessert", "spanish"],
          },
        },
      },
      on_intent: {
        checkout: { context: "general", category: "confirm_order" },
      },
    },

    {
      id: "general.modify_order",
      response:
        "Dime qué quieres cambiar: quitar un item, cambiar cantidad o vaciar pedido.",
      suggestions: [
        "➖ Quitar item",
        "🔢 Cambiar cantidad",
        "🗑️ Vaciar",
        "⬅️ Volver",
      ],
      on_select: {
        "⬅️ Volver": { context: "general", category: "view_order" },
      },
    },

    {
      id: "general.payment",
      response:
        "Listo. Te llevo a pagar. ¿Quieres pagar con tarjeta o efectivo?",
      suggestions: ["💳 Tarjeta", "💵 Efectivo", "⬅️ Volver"],
      on_select: {
        "⬅️ Volver": { context: "general", category: "checkout" },
      },
    },
  ],
};
