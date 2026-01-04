import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BodyPart = 'neck' | 'shoulders' | 'chest' | 'back' | 'lumbar' | 'arms' | 'quads' | 'knees' | 'calves' | 'glutes';

@Component({
  selector: 'app-body-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center p-5 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-[360px] mx-auto animate-fade-in-up font-sans select-none">
      
      <!-- Header -->
      <div class="w-full text-center mb-4 border-b border-slate-100 pb-2">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Localiza tu Dolor</h3>
        <p class="text-[10px] text-slate-400">Selecciona el grupo muscular afectado</p>
      </div>

      <!-- Main Container -->
      <div class="relative w-full h-[400px] flex justify-center items-center gap-2">
        
        <!-- Hover Tooltip Type (Floating) -->
        <div class="absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none transition-all duration-300 transform"
             [class.opacity-100]="hoveredPart()" 
             [class.translate-y-0]="hoveredPart()"
             [class.opacity-0]="!hoveredPart()"
             [class.-translate-y-2]="!hoveredPart()">
          <span class="bg-slate-800 text-white text-[10px] font-bold py-1 px-3 rounded-full shadow-lg tracking-wide uppercase flex items-center gap-1.5">
             <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
             {{ getLabel(hoveredPart()) }}
          </span>
        </div>

        <!-- SVG ANATOMY CANVAS -->
        <svg viewBox="0 0 400 500" class="w-full h-full drop-shadow-md">
          <defs>
            <!-- Skin Gradient -->
            <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#ffe8dc; stop-opacity:1" />
              <stop offset="50%" style="stop-color:#ebd0c2; stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ffe8dc; stop-opacity:1" />
            </linearGradient>
            <!-- Muscle Shadow/Volume -->
            <filter id="volume">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
              <feOffset in="blur" dx="0.5" dy="0.5" result="offsetBlur"/>
              <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
            </filter>
            <!-- Active Glow -->
            <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="3" result="blur"/>
               <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          <!-- ====== FRONT VIEW (LEFT) ====== -->
          <g transform="translate(20, 20) scale(0.9)">
            <!-- Head Base -->
             <path d="M75,10 Q50,10 50,45 Q50,70 75,80 Q100,70 100,45 Q100,10 75,10" fill="#ebd0c2" />
             
            <!-- Neck / Traps (Front) -->
            <path class="muscle" d="M50,60 Q20,70 10,85 L35,85 L50,60 M100,60 Q130,70 140,85 L115,85 L100,60" 
                  (click)="selectPart('neck')" (mouseenter)="setHover('neck')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'neck'" />

            <!-- Pectorals (Chest) -->
            <path class="muscle" d="M35,90 Q75,120 115,90 L115,130 Q75,150 35,130 Z" 
                  (click)="selectPart('chest')" (mouseenter)="setHover('chest')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'chest'"/>

            <!-- Deltoids (Shoulders) -->
            <path class="muscle" d="M10,85 Q0,100 5,120 L30,110 L35,85 Z  M140,85 Q150,100 145,120 L120,110 L115,85 Z" 
                  (click)="selectPart('shoulders')" (mouseenter)="setHover('shoulders')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'shoulders'"/>

            <!-- Abs (Abdominals) -->
            <path class="muscle" d="M45,135 L105,135 L100,190 L50,190 Z" 
                  (click)="selectPart('lumbar')" (mouseenter)="setHover('lumbar')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'lumbar'"/>

            <!-- Arms (Biceps/Forearms) -->
            <path class="muscle" d="M5,125 L30,115 L25,200 L5,190 Z  M145,125 L120,115 L125,200 L145,190 Z" 
                  (click)="selectPart('arms')" (mouseenter)="setHover('arms')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'arms'"/>

            <!-- Quads (Thighs) -->
            <path class="muscle" d="M40,200 L70,200 L65,300 L45,300 Z  M80,200 L110,200 L105,300 L85,300 Z" 
                  (click)="selectPart('quads')" (mouseenter)="setHover('quads')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'quads'"/>

            <!-- Knees -->
             <circle cx="55" cy="310" r="10" class="muscle" (click)="selectPart('knees')" (mouseenter)="setHover('knees')" (mouseleave)="clearHover()" [class.active]="selectedPart() === 'knees'"/>
             <circle cx="95" cy="310" r="10" class="muscle" (click)="selectPart('knees')" (mouseenter)="setHover('knees')" (mouseleave)="clearHover()" [class.active]="selectedPart() === 'knees'"/>

            <!-- Shins (Lower Leg Front) -->
            <path class="muscle" d="M45,325 L65,325 L60,400 L50,400 Z  M85,325 L105,325 L100,400 L90,400 Z" 
                  (click)="selectPart('calves')" (mouseenter)="setHover('calves')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'calves'"/>
          </g>

          <!-- ====== BACK VIEW (RIGHT) ====== -->
          <g transform="translate(200, 20) scale(0.9)">
             <!-- Head Base Back -->
             <path d="M75,10 Q50,10 50,45 Q50,70 75,80 Q100,70 100,45 Q100,10 75,10" fill="#e0c0b0" />

             <!-- Trapezius / Neck (Back) - KEY AREA -->
             <path class="muscle" d="M75,50 L50,65 L30,85 L120,85 L100,65 Z" 
                   (click)="selectPart('neck')" (mouseenter)="setHover('neck')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'neck'" />

             <!-- Dorsals (Upper Back) -->
             <path class="muscle" d="M30,90 L120,90 L110,150 L40,150 Z" 
                   (click)="selectPart('back')" (mouseenter)="setHover('back')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'back'"/>
            
             <!-- Shoulders Back -->
             <path class="muscle" d="M10,85 Q0,100 5,120 L30,110 L30,85 Z  M140,85 Q150,100 145,120 L120,110 L120,85 Z" 
                  (click)="selectPart('shoulders')" (mouseenter)="setHover('shoulders')" (mouseleave)="clearHover()"
                  [class.active]="selectedPart() === 'shoulders'"/>

             <!-- Lumbar (Lower Back) -->
             <path class="muscle" d="M45,155 L105,155 L100,190 L50,190 Z" 
                   (click)="selectPart('lumbar')" (mouseenter)="setHover('lumbar')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'lumbar'"/>
             
             <!-- Glutes -->
             <path class="muscle" d="M40,195 L75,195 L70,240 L40,230 Z  M75,195 L110,195 L110,230 L80,240 Z" 
                   (click)="selectPart('glutes')" (mouseenter)="setHover('glutes')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'glutes'"/>

             <!-- Hamstrings (Back Thighs) -->
             <path class="muscle" d="M45,245 L70,245 L65,310 L45,310 Z  M80,245 L105,245 L105,310 L85,310 Z" 
                   (click)="selectPart('quads')" (mouseenter)="setHover('quads')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'quads'"/>

             <!-- Calves (Back Leg) -->
             <path class="muscle" d="M45,320 L70,320 L65,400 L50,400 Z  M80,320 L105,320 L100,400 L85,400 Z" 
                   (click)="selectPart('calves')" (mouseenter)="setHover('calves')" (mouseleave)="clearHover()"
                   [class.active]="selectedPart() === 'calves'"/>
          </g>

          <!-- Labels -->
          <text x="75" y="440" font-size="10" text-anchor="middle" fill="#94a3b8" font-weight="bold">FRONTAL</text>
          <text x="275" y="440" font-size="10" text-anchor="middle" fill="#94a3b8" font-weight="bold">DORSAL</text>

        </svg>
      </div>
      
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .muscle {
      fill: url(#skin);
      stroke: #d1b0a0;
      stroke-width: 1px;
      cursor: pointer;
      transition: all 0.2s ease-out;
      filter: url(#volume);
    }

    /* Hover effect */
    .muscle:hover {
      fill: #ff8a80; /* Salmon/Red tint */
      stroke: #d32f2f;
      transform: scale(1.02);
      filter: drop-shadow(0 0 4px rgba(211, 47, 47, 0.4));
      z-index: 10;
    }

    /* Active/Selected effect */
    .muscle.active {
      fill: #ef5350; /* Strong Red */
      stroke: #b71c1c;
      stroke-width: 1.5px;
      filter: url(#activeGlow);
      animation: pulseMuscle 2s infinite;
    }

    @keyframes pulseMuscle {
      0% { opacity: 1; }
      50% { opacity: 0.8; filter: drop-shadow(0 0 10px rgba(239, 83, 80, 0.6)); }
      100% { opacity: 1; }
    }
    
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in-up {
        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class BodySelectorComponent {
  @Output() partSelected = new EventEmitter<string>();
  
  selectedPart = signal<BodyPart | null>(null);
  hoveredPart = signal<BodyPart | null>(null);

  partLabels: Record<string, string> = {
    'neck': 'Cervicales / Trapecios',
    'shoulders': 'Hombros / Deltoides',
    'chest': 'Pectoral / Torax',
    'back': 'Dorsales / Espalda Alta',
    'lumbar': 'Lumbares / Zona Baja',
    'arms': 'Brazos',
    'quads': 'Muslos / Pierna Sup.',
    'knees': 'Rodillas',
    'calves': 'Gemelos / Pantorrillas',
    'glutes': 'Glúteos / Cadera'
  };

  setHover(part: string) {
    this.hoveredPart.set(part as BodyPart);
  }

  clearHover() {
    this.hoveredPart.set(null);
  }

  getLabel(part: BodyPart | null): string {
    if (!part) return '';
    return this.partLabels[part] || part;
  }

  selectPart(part: string) {
    console.log("📍 BodySelector (Vectorial): Part Clicked ->", part);
    const p = part as BodyPart;
    this.selectedPart.set(p);
    
    setTimeout(() => {
        this.partSelected.emit(this.partLabels[p]);
    }, 200);
  }
}
