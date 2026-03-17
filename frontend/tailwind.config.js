/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        "space": ["Space Grotesk", "sans-serif"],
        "sans": ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        "primary": "#5048e5",
        "secondary": "#7c3aed",
        "primary-hover": "#4338ca",
        "background-light": "#f6f6f8",
        "background-dark": "#121121",
        "card-light": "#ffffff",
        "card-dark": "#1e1c2e",
        "surface": "#ffffff",
        // Neural Lab Specifics
        "neural-primary": "#10b981",
        "neural-secondary": "#6366f1",
        "neural-bg": "#f3f4f6",
        // Clinical System
        "clinical-blue": "#1B36D3",
        "clinical-light": "#F8F9FC",
        "clinical-dark": "#0A1244",
        "clinical-gray": "#64748B",
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
        'soft': '0 20px 50px -12px rgba(27, 54, 211, 0.08)',
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px",
        "4xl": "2.5rem",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
