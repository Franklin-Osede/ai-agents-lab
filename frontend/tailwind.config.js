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
        "primary-hover": "#4338ca",
        "background-light": "#f8fafc", // Slightly cooler gray from user mock
        "background-dark": "#111827", // Updated to match user mock
        "card-light": "#ffffff",
        "card-dark": "#1e1c2e",
        "surface": "#ffffff",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
          'gradient-team': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'progress-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'brand-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'brand-gradient-hover': 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'card-active': '0 0 0 2px #4f46e5, 0 10px 15px -3px rgba(79, 70, 229, 0.1)',
        'float': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
