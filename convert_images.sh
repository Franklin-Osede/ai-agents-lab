#!/bin/bash
cd frontend/src/assets/food_images

# Function to convert and rename
convert_image() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ]; then
        echo "Converting '$src' to '$dest'..."
        ffmpeg -y -i "$src" -quality 80 "$dest" 2>/dev/null
        if [ $? -eq 0 ]; then
            rm "$src"
            echo "Success."
        else
            echo "Failed to convert '$src'"
        fi
    else
        echo "Source file '$src' not found."
    fi
}

# Conversions
convert_image "Agua Mineral .jpg" "mineral_water.webp"
convert_image "Asahi Beer (Japón) .jpg" "asahi.webp"
convert_image "Bacon Cheese .jpg" "burger_bacon.webp"
convert_image "Batido de Fresa .jpeg" "strawberry_shake.webp"
convert_image "Bento Box .jpg" "bento_box.webp"
convert_image "Brownie .jpg" "brownie.webp"
convert_image "Caesar Salad .jpg" "caesar_salad.webp"
convert_image "Cannoli .jpg" "cannoli.webp"
convert_image "Carbonara.jpg" "carbonara.webp"
convert_image "Cerveza (España) .jpg" "cerveza.webp"
convert_image "Chicken Tenders .jpg" "chicken_tenders.webp"
convert_image "Chicken Teriyaki niños.jpg" "chicken_teriyaki.webp"
convert_image "Chicken Wings .webp" "chicken_wings_temp.webp" # Handle same extension
mv "chicken_wings_temp.webp" "chicken_wings.webp"
convert_image "Chorizo a la Sidra .jpg" "chorizo_sidra.webp"
convert_image "Churros.avif" "churros.webp"
convert_image "Classic Smash .jpeg" "burger_smash.webp"
convert_image "Cola.jpg" "cola.webp"
convert_image "Crema Catalana .jpg" "crema_catalana.webp"
convert_image "Crispy Chicken Sandwich.avif" "chicken_sandwich.webp"
convert_image "Croquetas .jpg" "croquetas.webp"
convert_image "Cucumber Roll (Niños) .jpg" "cucumber_roll.webp"
convert_image "Diablo Burger (Picante) .jpg" "diablo_burger.webp"
convert_image "Dorayaki .jpg" "dorayaki.webp"
convert_image "Dragon Roll .jpg" "dragon_roll.webp"
convert_image "Dynamite Roll .jpg" "dynamite_roll.webp"
convert_image "Fries (Patatas) .png" "fries.webp"
convert_image "Gyoza.jpg" "gyoza.webp"
convert_image "Helado Sundae .jpg" "sundae.webp"
convert_image "Jamón Ibérico .jpg" "jamon_iberico.webp"
convert_image "Katsu Curry .jpg" "katsu_curry.webp"
convert_image "Kids Burger .png" "kids_burger.webp"
convert_image "Lasagna .jpg" "lasagna.webp"
convert_image "Macarrones Queso .jpg" "mac_cheese.webp"
convert_image "Margherita Pizza .jpg" "pizza_margherita.webp"
convert_image "Matcha Cheesecake .jpg" "matcha_cheesecake.webp"
convert_image "Mini Margherita (Niños) .jpg" "mini_margherita.webp"
convert_image "Mini Ramen (Niños) .webp" "mini_ramen_temp.webp"
mv "mini_ramen_temp.webp" "mini_ramen.webp"
convert_image "Miso.jpg" "miso_soup.webp"
convert_image "Mochi Ice Cream.jpg" "mochi.webp"
convert_image "Nuggets .jpg" "nuggets.webp"
convert_image "Onion Rings .jpg" "onion_rings.webp"
convert_image "Paella Mixta .jpg" "paella.webp"
convert_image "Panna Cotta .jpg" "panna_cotta.webp"
convert_image "Patatas Bravas .jpg" "patatas_bravas.webp"
convert_image "Ramune (Japón) .jpg" "ramune.webp"
convert_image "Risotto Funghi .jpg" "risotto_funghi.webp"
convert_image "Sake (Japón) .jpg" "sake.webp"
convert_image "Salmon Nigiri Set .jpg" "salmon_nigiri.webp"
convert_image "Spaghetti Bambino (Niños).webp" "spaghetti_bambino.webp" # Just rename if already webp? ffmpeg will copy
convert_image "Spicy Ramen .jpg" "spicy_ramen.webp"
convert_image "Spicy Tuna Roll .jpg" "spicy_tuna.webp"
convert_image "Spicy Wings .jpg" "spicy_wings.webp"
convert_image "Sushi Set Deluxe .jpg" "sushi_set.webp"
convert_image "Tamago Sushi (Niños).jpg" "tamago_sushi.webp"
convert_image "Tempura Udon .jpg" "tempura_udon.webp"
convert_image "Tiramisu.jpg" "tiramisu.webp"
convert_image "Tortilla Española .jpg" "tortilla_espanola.webp"
convert_image "Tortilla Francesa (Niños) .webp" "tortilla_francesa.webp"
convert_image "Truffle Burger .png" "burger_truffle.webp"
convert_image "Vino Rioja (España:Ital).webp" "vino_rioja.webp"
convert_image "Volcano Roll .jpg" "volcano_roll.webp"
# Edamame is already edamame.webp but checking
if [ -f "edamame.webp" ]; then
    echo "Edamame already webp"
fi

echo "Conversion complete."
