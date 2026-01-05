/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#4f46e5", // Indigo from prompt
        "secondary": "#7c3aed", // Purple from prompt
        "background-light": "#f9fafb", // Light gray from prompt
        "background-dark": "#121121",
        "card-light": "#ffffff",
        "card-dark": "#1e1c2e",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
          'gradient-team': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'progress-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
