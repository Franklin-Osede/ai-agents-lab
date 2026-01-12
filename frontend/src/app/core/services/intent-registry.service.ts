import { Injectable } from '@angular/core';

export interface IntentPreset {
  name: string;
  keywords: string[];
  icon: string; // Material symbol
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntentRegistryService {

  private readonly COMMON_PRESETS: IntentPreset[] = [
    { 
      name: 'Agendar', 
      keywords: ['cita', 'reservar', 'hora', 'hueco', 'disponibilidad', 'agendar', 'quiero ir', 'mañana', 'tarde'],
      icon: 'calendar_month' 
    },
    { 
      name: 'Cancelar', 
      keywords: ['cancelar', 'anular', 'no puedo', 'borrar cita', 'cambiar fecha', 'reprogramar'],
      icon: 'cancel' 
    },
    { 
      name: 'Humano', 
      keywords: ['persona', 'agente', 'hablar con alguien', 'operador', 'real', 'humano'],
      icon: 'support_agent' 
    },
    { 
      name: 'Precio', 
      keywords: ['precio', 'cuesta', 'vale', 'tarifa', 'presupuesto', 'cuanto'],
      icon: 'payments' 
    },
    {
        name: 'Ubicación',
        keywords: ['donde', 'ubicacion', 'direccion', 'calle', 'llegar', 'mapa', 'sitio'],
        icon: 'location_on'
    }
  ];

  private readonly NICHE_PRESETS: Record<string, IntentPreset[]> = {
    'dental': [
      { name: 'Urgencia', keywords: ['dolor', 'muela', 'sangre', 'roto', 'urgente', 'emergencia', 'duele mucho'], icon: 'dentistry' },
      { name: 'Limpieza', keywords: ['limpieza', 'higiene', 'sarro', 'revisión', 'limpiar'], icon: 'cleaning_services' },
      { name: 'Ortodoncia', keywords: ['brackets', 'invisalign', 'dientes torcidos', 'alinear', 'aparato'], icon: 'sentiment_very_satisfied' }
    ],
    'physio': [
      { name: 'Dolor Espalda', keywords: ['cervicales', 'lumbalgia', 'espalda', 'cuello', 'contractura'], icon: 'accessibility_new' },
      { name: 'Masaje', keywords: ['masaje', 'descarga', 'relax', 'muscular'], icon: 'spa' },
      { name: 'Rehabilitación', keywords: ['lesión', 'esguince', 'recuperación', 'operación'], icon: 'healing' }
    ],
    'doctors': [
         { name: 'Urgencia', keywords: ['dolor fuerte', 'fiebre', 'sangrado', 'malestar'], icon: 'medical_services' },
         { name: 'Resultados', keywords: ['analítica', 'resultados', 'informe', 'pruebas'], icon: 'assignment' },
         { name: 'Seguros', keywords: ['adeslas', 'sanitas', 'mapfre', 'dkv', 'seguro', 'sociedad'], icon: 'card_membership' }
    ],
    'hair': [ // Peluqueria
        { name: 'Color/Mechas', keywords: ['tinte', 'balayage', 'raices', 'puntas', 'color', 'mechas'], icon: 'palette' },
        { name: 'Corte', keywords: ['corte', 'cortar', 'cambio look', 'sanear'], icon: 'content_cut' },
        { name: 'Alisado', keywords: ['alisado', 'keratina', 'tratamiento', 'brillo'], icon: 'straighten' }
    ],
    'barber': [
        { name: 'Barba', keywords: ['arreglar barba', 'afeitado', 'perfilado', 'toalla caliente'], icon: 'face' },
        { name: 'Corte', keywords: ['degradado', 'corte caballero', 'rapado'], icon: 'content_cut' }
    ],
    'beauty': [ // Estetica
        { name: 'Botox/Labios', keywords: ['arrugas', 'relleno', 'aumento', 'labios', 'botox'], icon: 'face_retouching_natural' },
        { name: 'Corporal', keywords: ['celulitis', 'grasa', 'reafirmante', 'piernas'], icon: 'accessibility' },
        { name: 'Valoración', keywords: ['primera cita', 'valoracion', 'diagnostico', 'gratis'], icon: 'assignment_turned_in' }
    ],
     'nails': [
        { name: 'Manicura', keywords: ['uñas', 'gel', 'acrilico', 'semipermanente', 'relleno'], icon: 'brush' },
        { name: 'Pedicura', keywords: ['pies', 'durezas', 'uñas pies'], icon: 'foot_print' } // Material symbol might not exist, checking later
    ],
    'nutrition': [
        { name: 'Perder Peso', keywords: ['dieta', 'adelgazar', 'bajar kilos', 'grasa'], icon: 'monitor_weight' },
        { name: 'Deportiva', keywords: ['ganar musculo', 'volumen', 'rendimiento'], icon: 'fitness_center' }
    ],
    'trainer': [
        { name: 'Entrenamiento', keywords: ['rutina', 'plan', 'empezar', 'fuerte'], icon: 'fitness_center' },
        { name: 'Oposiciones', keywords: ['policia', 'bombero', 'pruebas fisicas'], icon: 'timer' }
    ],
     'lawyer': [
        { name: 'Divorcio', keywords: ['separación', 'custodia', 'convenio', 'ex'], icon: 'gavel' },
        { name: 'Laboral', keywords: ['despido', 'finiquito', 'baja', 'trabajo'], icon: 'work_off' },
        { name: 'Herencia', keywords: ['testamento', 'herencia', 'notario', 'fallecimiento'], icon: 'article' }
    ]
  };



  getPresets(niche: string): IntentPreset[] {
    const normalizedNiche = niche?.toLowerCase().trim();
    const specificPresets = this.NICHE_PRESETS[normalizedNiche] || [];
    
    // Always return generic presets + specific ones
    // Filter duplicates just in case
    return [...this.COMMON_PRESETS, ...specificPresets];
  }
}
