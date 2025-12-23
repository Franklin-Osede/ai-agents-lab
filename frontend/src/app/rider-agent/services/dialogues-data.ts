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
        "🛒 Ver pedido",
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
      suggestions: ["➕ Seguir pidiendo", "🛒 Ver pedido", "✅ Finalizar"],
      on_select: {
        "➕ Seguir pidiendo": { context: "general", category: "default" },
        "🛒 Ver pedido": { context: "general", category: "view_order" },
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
      suggestions: [
        "✅ Confirmar",
        "✏️ Modificar",
        "➕ Añadir algo",
        "⬅️ Volver",
      ],
      on_select: {
        "✅ Confirmar": { context: "general", category: "confirm_order" },
        "✏️ Modificar": { context: "general", category: "modify_order" },
        "➕ Añadir algo": { context: "general", category: "default" },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
      on_intent: {
        confirm_order: { context: "general", category: "confirm_order" },
        modify_order: { context: "general", category: "modify_order" },
        continue_ordering: { context: "general", category: "default" },
      },
    },

    {
      id: "general.confirm_order",
      response: "Genial. ¿Recogida o a domicilio?",
      suggestions: [
        "🚶 Recogida",
        "🏠 A domicilio",
        "📅 Reservar Mesa",
        "⬅️ Volver",
      ],
      on_select: {
        "🚶 Recogida": {
          context: "general",
          category: "checkout",
          set_memory: { delivery_method: "pickup" },
        },
        "🏠 A domicilio": {
          context: "general",
          category: "checkout",
          set_memory: { delivery_method: "delivery" },
        },
        "📅 Reservar Mesa": {
          context: "general",
          category: "reservation_entry", // New Category
        },
        "⬅️ Volver": { context: "general", category: "view_order" },
      },
      on_intent: {
        choose_pickup: {
          context: "general",
          category: "checkout",
          set_memory: { delivery_method: "pickup" },
        },
        choose_delivery: {
          context: "general",
          category: "checkout",
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
        "Aquí tienes nuestros entrantes más populares. ¿Te apetece alguno?",
      suggestions: ["Edamame", "Gyoza", "Sopa Miso", "⬅️ Volver"],
      on_select: {
        Edamame: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Edamame",
            price: 4.5,
            image:
              "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e",
          }, // Simple mock item injection
        },
        Gyoza: {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Gyoza",
            price: 6.0,
            image: "https://images.unsplash.com/photo-1541544744-378ca6f04085",
          },
        },
        "Sopa Miso": {
          context: "japanese",
          category: "added_starter",
          add_item: {
            name: "Sopa Miso",
            price: 3.5,
            image: "https://images.unsplash.com/photo-1547592180-85f173990554",
          },
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
    },

    {
      id: "japanese.added_starter",
      response: "¡Añadido! 👌 ¿Pasamos a los platos principales o sushi?",
      suggestions: ["🍣 Ver Principales", "🍜 Ramen", "🥤 Bebidas"],
      on_select: {
        "🍣 Ver Principales": { context: "japanese", category: "mains" },
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" },
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
      },
    },

    {
      id: "japanese.mains",
      response: "Nuestra selección de Sushi y Platos calientes.",
      suggestions: [
        "🍣 Sushi Set",
        "🍛 Curry Japonés",
        "🍱 Bento Box",
        "⬅️ Volver",
      ],
      on_select: {
        "🍣 Sushi Set": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image:
              "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
          },
        },
        "🍛 Curry Japonés": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Katsu Curry",
            price: 14.0,
            image:
              "https://images.unsplash.com/photo-1563484227706-53d92fb9c56f",
          },
        },
        "🍱 Bento Box": {
          context: "japanese",
          category: "added_main",
          add_item: {
            name: "Bento Box",
            price: 16.5,
            image:
              "https://images.unsplash.com/photo-1623961817344-672dc6788db3",
          },
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
      },
    },

    {
      id: "japanese.added_main",
      response: "¡Excelente elección! 😋 ¿Te pongo algo de beber o un postre?",
      suggestions: ["🥤 Bebidas", "🍰 Postres", "✅ Ver Pedido / Finalizar"],
      on_select: {
        "🥤 Bebidas": { context: "japanese", category: "drinks" },
        "🍰 Postres": { context: "japanese", category: "dessert" },
        "✅ Ver Pedido / Finalizar": {
          context: "general",
          category: "view_order",
        },
      },
    },

    {
      id: "japanese.menu",
      response:
        "En japonés tenemos sushi, ramen y platos calientes. ¿Qué te apetece?",
      suggestions: ["🍣 Sushi", "🍜 Ramen", "🔥 Platos calientes", "⬅️ Volver"],
      on_select: {
        "🍣 Sushi": { context: "japanese", category: "mains" }, // Redirects to new mains
        "🍜 Ramen": { context: "japanese", category: "menu_ramen" },
        "🔥 Platos calientes": {
          context: "japanese",
          category: "menu_hot",
        },
        "⬅️ Volver": { context: "japanese", category: "default" },
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
      suggestions: ["🍶 Con alcohol", "🍵 Sin alcohol", "✅ No, gracias"],
      on_select: {
        "🍶 Con alcohol": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Sake", tags: ["drink", "japanese"] },
        },
        "🍵 Sin alcohol": {
          context: "general",
          category: "add_to_order",
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
      suggestions: ["🍷 Vino", "🥤 Refresco", "☕ Café", "⬅️ Volver"],
      on_select: {
        "🍷 Vino": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Vino", tags: ["drink", "italian"] },
        },
        "🥤 Refresco": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Refresco", tags: ["drink", "italian"] },
        },
        "☕ Café": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Café", tags: ["drink", "italian"] },
        },
        "⬅️ Volver": { context: "italian", category: "default" },
      },
    },

    {
      id: "italian.dessert",
      response: "Postres: Tiramisú casero. ¿Individual o para compartir?",
      suggestions: [
        "🍰 Individual",
        "👨‍👩‍👧‍👦 Compartir",
        "✅ Ya lo tengo todo",
        "⬅️ Volver",
      ],
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
        "⬅️ Volver": { context: "italian", category: "default" },
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
      suggestions: ["🥤 Refresco", "🥛 Batido", "💧 Agua", "⬅️ Volver"],
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
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.dessert",
      response: "Postres: helado o brownie. ¿Cuál te apetece?",
      suggestions: ["🍦 Helado", "🍫 Brownie", "⬅️ Volver"],
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
        "⬅️ Volver": { context: "fast_food", category: "default" },
      },
    },

    {
      id: "fast_food.menu_burger",
      response: "Aquí tienes nuestras mejores burgers. 🍔 ¿Cuál te pido?",
      suggestions: [
        "Classic Smash",
        "Truffle Burger",
        "Bacon Cheese",
        "⬅️ Volver",
      ],
      on_select: {
        "Classic Smash": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Classic Smash",
            price: 12.99,
            image:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
          },
        },
        "Truffle Burger": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Truffle Burger",
            price: 15.5,
            image:
              "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5",
          },
        },
        "Bacon Cheese": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Bacon Cheese",
            price: 13.99,
            image:
              "https://images.unsplash.com/photo-1596627196504-12d324d4220c",
          },
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.menu_chicken",
      response: "Pollo crujiente. 🍗 ¿Alitas o Sandwich?",
      suggestions: [
        "Chicken Wings",
        "Crispy Chicken Sandwich",
        "Chicken Tenders",
        "⬅️ Volver",
      ],
      on_select: {
        "Chicken Wings": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Wings",
            price: 10.99,
            image:
              "https://images.unsplash.com/photo-1513639776629-7b611594e29b",
          },
        },
        "Crispy Chicken Sandwich": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Crispy Chicken Sandwich",
            price: 11.5,
            image:
              "https://images.unsplash.com/photo-1626082927389-e1b715697b2f",
          },
        },
        "Chicken Tenders": {
          context: "fast_food",
          category: "added_main",
          add_item: {
            name: "Chicken Tenders",
            price: 9.99,
            image: "https://images.unsplash.com/photo-1562967963-ed7b199d9b69",
          },
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.menu_sides",
      response: "Para acompañar... 🍟",
      suggestions: ["Fries", "Onion Rings", "Caesar Salad", "⬅️ Volver"],
      on_select: {
        Fries: {
          context: "fast_food",
          category: "added_side", // Redirect to same logic (added_main works generally)
          add_item: {
            name: "Fries",
            price: 4.99,
            image:
              "https://images.unsplash.com/photo-1573080496987-a2267f884f4a",
          },
        },
        "Onion Rings": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Onion Rings",
            price: 5.5,
            image:
              "https://images.unsplash.com/photo-1639024471283-03518883512d",
          },
        },
        "Caesar Salad": {
          context: "fast_food",
          category: "added_side",
          add_item: {
            name: "Caesar Salad",
            price: 8.5,
            image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
          },
        },
        "⬅️ Volver": { context: "fast_food", category: "menu" },
      },
    },
    {
      id: "fast_food.added_main",
      response: "¡Añadido! 👌 ¿Algo más de comer o pasamos a la bebida?",
      suggestions: ["🥤 Bebidas", "🍟 Acompañantes", "✅ Ya lo tengo todo"],
      on_select: {
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
      suggestions: ["🥘 Tapas", "🍽️ Raciones", "⬅️ Volver"],
      on_select: {
        "🥘 Tapas": { context: "spanish", category: "menu_tapas" },
        "🍽️ Raciones": { context: "spanish", category: "menu_raciones" },
        "⬅️ Volver": { context: "spanish", category: "default" },
      },
    },

    {
      id: "spanish.kids",
      response: "Para peques: tortilla suave o croquetas. ¿Qué prefieres?",
      suggestions: ["🥔 Tortilla", "🧆 Croquetas", "⬅️ Volver"],
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
        "⬅️ Volver": { context: "spanish", category: "default" },
      },
    },

    {
      id: "spanish.spicy_level",
      response: "Modo picante 🌶️. ¿Suave o fuerte?",
      suggestions: ["🌶️ Suave", "🌶️🌶️ Fuerte", "⬅️ Volver"],
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
        "⬅️ Volver": { context: "spanish", category: "default" },
      },
    },

    {
      id: "spanish.spicy_pick",
      response: "Te recomiendo patatas bravas o chorizo picante. ¿Cuál eliges?",
      suggestions: [
        "🥔 Patatas bravas",
        "🌶️ Chorizo picante",
        "⬅️ Cambiar",
        "⬅️ Volver",
      ],
      on_select: {
        "🥔 Patatas bravas": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Patatas bravas",
            tags: ["spicy", "spanish"],
          },
        },
        "🌶️ Chorizo picante": {
          context: "general",
          category: "add_to_order",
          add_item: {
            name: "Chorizo picante",
            tags: ["spicy", "spanish"],
          },
        },
        "⬅️ Cambiar": { context: "spanish", category: "spicy_level" },
        "⬅️ Volver": { context: "spanish", category: "default" },
      },
    },

    {
      id: "spanish.drinks",
      response: "Para beber: vino, cerveza o refresco. ¿Qué te pongo?",
      suggestions: ["🍷 Vino", "🍺 Cerveza", "🥤 Refresco", "⬅️ Volver"],
      on_select: {
        "🍷 Vino": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Vino", tags: ["drink", "spanish"] },
        },
        "🍺 Cerveza": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Cerveza", tags: ["drink", "spanish"] },
        },
        "🥤 Refresco": {
          context: "general",
          category: "add_to_order",
          add_item: { name: "Refresco", tags: ["drink", "spanish"] },
        },
        "⬅️ Volver": { context: "spanish", category: "default" },
      },
    },

    {
      id: "spanish.dessert",
      response:
        "Postres: churros con chocolate o crema catalana. ¿Cuál prefieres?",
      suggestions: ["🍩 Churros", "🍮 Crema catalana", "⬅️ Volver"],
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
        "⬅️ Volver": { context: "spanish", category: "default" },
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
