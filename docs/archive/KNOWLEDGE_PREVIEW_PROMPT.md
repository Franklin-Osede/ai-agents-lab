# Prompt: Knowledge Preview Screen (Mostrar lo Escaneado)

## Para v0.dev / Bolt / Claude Artifacts

```
Create a "Knowledge Preview" screen for an AI SaaS platform that shows what the AI learned from scraping a website:

DESIGN SYSTEM:
- Primary: #4f46e5 (indigo), Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Background: #f9fafb (light gray)
- Card-based layout with white cards
- Modern, clean, data-focused design
- Font: Inter

LAYOUT:
Mobile-first design (max-width: 480px)

HEADER SECTION:
- Back button (top left)
- Title: "Conocimiento Extraído"
- Subtitle: "Revisa lo que la IA aprendió de tu sitio web"
- Source URL badge:
  - Small pill badge
  - Icon: 🌐
  - Text: "clinica-ejemplo.com"
  - Gray background, small text

MAIN CONTENT (Scrollable):

1. SUCCESS BANNER (Top):
   - Light green background (#f0fdf4)
   - Green border-left (4px, #10b981)
   - Icon: ✓ (green checkmark)
   - Text: "Scraping completado exitosamente"
   - Subtext: "12 servicios detectados • 3 páginas analizadas"

2. CARD: "Servicios Detectados"
   - Header:
     - Icon: 💼 (briefcase)
     - Title: "Servicios Detectados"
     - Badge: "12 encontrados" (indigo background)
   - Content:
     - List of services (each item):
       - Service name (bold)
       - Price (if found) - green text
       - Confidence badge (0-100%) - small, gray
       - Edit icon (pencil, appears on hover)
     - Example items:
       - "Fisioterapia Deportiva" - 50€ - 95% confidence
       - "Masaje Terapéutico" - 40€ - 87% confidence
       - "Rehabilitación Postural" - 45€ - 92% confidence
   - Footer:
     - "+ Agregar servicio manualmente" (link, indigo color)

3. CARD: "Información de Contacto"
   - Header:
     - Icon: 📞 (phone)
     - Title: "Contacto"
     - Edit button (top right)
   - Content (grid layout):
     - Phone: "+34 123 456 789" (with phone icon)
     - Email: "info@clinica.com" (with email icon)
     - Address: "Calle Principal 123, Madrid" (with location icon)
     - Website: "clinica-ejemplo.com" (with globe icon)
   - Empty state (if not found):
     - Gray dashed border
     - Icon: 🔍
     - Text: "No se encontró información de contacto"
     - Button: "Agregar manualmente"

4. CARD: "Horarios de Atención"
   - Header:
     - Icon: 🕐 (clock)
     - Title: "Horarios"
     - Edit button
   - Content:
     - Table/List format:
       - Lunes - Viernes: 9:00 - 20:00
       - Sábado: 10:00 - 14:00
       - Domingo: Cerrado
   - Each day has a small toggle switch (enable/disable)

5. CARD: "Equipo Profesional" (Optional)
   - Header:
     - Icon: 👥 (people)
     - Title: "Profesionales"
     - Badge: "3 detectados"
   - Content:
     - List of team members:
       - Avatar placeholder (circle)
       - Name: "Dr. Carlos Ruiz"
       - Role: "Fisioterapeuta"
       - Specialties: "Deportiva, Traumatología"
   - Empty state:
     - "No se detectaron profesionales en la web"

STATS FOOTER:
- Sticky bottom section (above CTA)
- Light gray background
- Icons + numbers:
  - 📄 12 páginas escaneadas
  - ⏱️ 2 minutos de análisis
  - ✓ 95% de confianza promedio

BOTTOM CTA (Fixed):
- Two buttons (side by side):
  - "Volver a Escanear" (outline, gray)
  - "Continuar al Workflow" (solid, indigo gradient) - PRIMARY

FEATURES:
- Each card has subtle shadow
- Hover effects on editable items
- Smooth fade-in animation when data loads
- Loading skeleton states (for async data)
- Edit mode: Click pencil → Input field appears inline
- Confidence badges:
  - 90-100%: Green
  - 70-89%: Yellow
  - <70%: Orange

INTERACTIONS:
- Click "Edit" on any item → Inline editing
- Click service → Expand to show more details
- Click "Continuar al Workflow" → Navigate to workflow builder
- Click "Volver a Escanear" → Go back to URL input

STYLE:
- Professional, data-dashboard aesthetic
- Similar to Notion or Linear.app
- Clean typography hierarchy
- Generous white space between cards
- Subtle shadows and borders
- Indigo/purple accents for interactive elements

EMPTY STATES:
- Friendly, not alarming
- Icon + short text + action button
- Example: "No se encontraron precios. ¿Quieres agregarlos manualmente?"

MOBILE OPTIMIZATIONS:
- Cards stack vertically
- Touch-friendly tap targets (min 44px)
- Swipe to edit gestures
- Bottom sheet for edit mode

Export as React/Angular component with:
- Mock data structure
- TypeScript interfaces
- Responsive CSS
```

---

## Ejemplo de Datos Mock

```typescript
interface KnowledgePreview {
  sourceId: string;
  url: string;
  scrapedAt: Date;
  stats: {
    pagesScanned: number;
    timeElapsed: number; // seconds
    averageConfidence: number; // 0-1
  };
  services: Service[];
  contact: ContactInfo;
  schedule: Schedule;
  team: TeamMember[];
}

interface Service {
  id: string;
  name: string;
  price?: string;
  confidence: number; // 0-1
  description?: string;
  duration?: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

interface Schedule {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar?: string;
}

// Mock Data Example
const mockData: KnowledgePreview = {
  sourceId: "src-123",
  url: "https://clinica-ejemplo.com",
  scrapedAt: new Date(),
  stats: {
    pagesScanned: 12,
    timeElapsed: 120,
    averageConfidence: 0.91,
  },
  services: [
    {
      id: "svc-1",
      name: "Fisioterapia Deportiva",
      price: "50€",
      confidence: 0.95,
      description: "Rehabilitación de lesiones deportivas",
      duration: "60 min",
    },
    {
      id: "svc-2",
      name: "Masaje Terapéutico",
      price: "40€",
      confidence: 0.87,
      duration: "45 min",
    },
    {
      id: "svc-3",
      name: "Rehabilitación Postural",
      price: "45€",
      confidence: 0.92,
      duration: "50 min",
    },
  ],
  contact: {
    phone: "+34 123 456 789",
    email: "info@clinica-ejemplo.com",
    address: "Calle Principal 123, 28001 Madrid",
    website: "clinica-ejemplo.com",
  },
  schedule: {
    monday: "9:00 - 20:00",
    tuesday: "9:00 - 20:00",
    wednesday: "9:00 - 20:00",
    thursday: "9:00 - 20:00",
    friday: "9:00 - 20:00",
    saturday: "10:00 - 14:00",
    sunday: "Cerrado",
  },
  team: [
    {
      id: "team-1",
      name: "Dr. Carlos Ruiz",
      role: "Fisioterapeuta",
      specialties: ["Deportiva", "Traumatología"],
    },
    {
      id: "team-2",
      name: "María González",
      role: "Fisioterapeuta",
      specialties: ["Neurológica", "Geriátrica"],
    },
  ],
};
```

---

## Wireframe ASCII

```
┌─────────────────────────────────────┐
│ ←  Conocimiento Extraído            │
│    Revisa lo que la IA aprendió     │
│    🌐 clinica-ejemplo.com           │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Scraping completado           │ │
│ │   12 servicios • 3 páginas      │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 💼 Servicios Detectados    [12] │ │
│ ├─────────────────────────────────┤ │
│ │ Fisioterapia Deportiva          │ │
│ │ 50€                      95% ✏️ │ │
│ │                                  │ │
│ │ Masaje Terapéutico              │ │
│ │ 40€                      87% ✏️ │ │
│ │                                  │ │
│ │ + Agregar servicio              │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 📞 Contacto               ✏️    │ │
│ ├─────────────────────────────────┤ │
│ │ 📱 +34 123 456 789              │ │
│ │ ✉️  info@clinica.com            │ │
│ │ 📍 Calle Principal 123          │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 🕐 Horarios               ✏️    │ │
│ ├─────────────────────────────────┤ │
│ │ Lun-Vie    9:00 - 20:00    [●] │ │
│ │ Sábado    10:00 - 14:00    [●] │ │
│ │ Domingo        Cerrado     [ ] │ │
│ └─────────────────────────────────┘ │
│                                      │
├─────────────────────────────────────┤
│ 📄 12 páginas  ⏱️ 2 min  ✓ 95%    │
├─────────────────────────────────────┤
│ [Volver a Escanear] [Continuar →]  │
└─────────────────────────────────────┘
```

---

## Por Qué Esta Pantalla es Crítica

1. **Transparencia**: El usuario VE exactamente qué aprendió la IA
2. **Confianza**: Puede validar y corregir errores
3. **Control**: Puede editar cualquier dato antes de continuar
4. **Valor Inmediato**: Ve resultados tangibles del scraping
5. **Conversión**: Si ve buenos resultados, seguirá al workflow

Esta pantalla es la **prueba social** de que tu producto funciona.
