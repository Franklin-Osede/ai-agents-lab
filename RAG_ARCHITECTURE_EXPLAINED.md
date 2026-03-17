# Guía Definitiva: Arquitectura RAG & Clasificación Inteligente

Este documento explica, sin tecnicismos innecesarios, cómo funciona el "cerebro" del agente, qué son los vectores y cómo el sistema entiende una web desconocida.

## 1. Conceptos Clave (Diccionario Rápido)

### ¿Qué son los "Tenants"?

Imagina que tu aplicación es un edificio de oficinas gigante (SaaS - Software as a Service).

- Tu plataforma es el **Edificio**.
- Cada cliente (Clínica Martínez, Pizzería Luigi, Despacho Pérez) es un **Inquilino (Tenant)**.
- **Multitenancy**: Significa que todos usan el mismo código (backend), pero sus datos están aislados. La Clínica Martínez NUNCA verá los datos de la Pizzería Luigi. Cada uno tiene su propio `tenant_id` que etiqueta toda su info.

### ¿Qué es "Vectorizar"?

Las computadoras no entienden significados, solo números.
Vectorizar es convertir texto en una lista de coordenadas (números).

- Frase A: "Me duele la espalda" -> `[0.1, 0.5, 0.9]`
- Frase B: "Tengo lumbago" -> `[0.1, 0.5, 0.8]` (Matemáticamente cerca de A)
- Frase C: "Quiero una hamburguesa" -> `[0.9, 0.1, 0.1]` (Matemáticamente lejos de A)

Esto nos permite buscar por **significado**, no por palabras exactas. Si el usuario dice "pupita en el hombro", el sistema encontrará "dolor articular" porque sus vectores están cerca.

### ¿Dónde se guarda?

En una base de datos normal (PostgreSQL) pero con una extensión especial llamada **pgvector**.

- Tabla `knowledge_base`:
  - `tenant_id`: "clinica_martinez"
  - `content`: "Tratamos la ciática por 50€."
  - `embedding`: `[0.23, 0.11, ...]` (El vector)

---

## 2. El Problema: "Web Desconocida"

Tienes toda la razón: **¿Cómo sabe el bot qué es un servicio y qué es un aviso legal si nunca ha visto esa web antes?**
El agente no sabe "a priori" qué encontrará, por lo que usamos dos niveles de inteligencia:

### Estrategia de Clasificación (El Filtro Inteligente)

No metemos todo el texto "a lo loco". Hacemos un proceso de **ETL Semántico** (Extract, Transform, Load) cuando leemos la web.

**Paso 1: Scraping Estructurado (Lectura)**
Usamos lo que se llaman _heurísticas_ o incluso un LLM barato (GPT-4o-mini) para leer el HTML crudo y limpiarlo.

- Eliminamos: Menús de navegación repetidos, footers, scripts, avisos de cookies.
- Nos quedamos con: Títulos (H1, H2), Párrafos (p) y Listas.

**Paso 2: Clasificación/Tagging (El "Bibliotecario IA")**
Antes de guardar, pasamos el contenido por un "Clasificador" (otro Prompt de IA pequeño y rápido):
_Input_: "Tratamiento de Punción Seca: 40€. Duración 30 min."
_Prompt Interno_: "¿Qué tipo de información es esta? (Servicio, Precio, Equipo, Contacto, Otro)"
_Output IA_: `Tag: SERVICE, Tag: PRICING`

**Paso 3: Guardado con Metadatos**
Guardamos el trozo de texto junto con su etiqueta.

- Registro en DB:
  - Texto: "Punción Seca 40€"
  - Tags: `['service', 'pricing']`
  - Vector: `[...]`

### ¿Por qué esto es brillante?

Cuando el usuario pregunte: _"¿Cuánto cuesta la punción?"_, tu búsqueda vectorial buscará vectores cercanos PERO priorizará (o filtrará) aquellos que tengan el tag `PRICING` o `SERVICE`. Así evitamos que responda con un artículo del blog que habla de la historia de la punción seca pero no dice el precio.

---

## 3. Ejemplo de Flujo Completo (El "Viaje del Dato")

1.  **Onboarding**: El Dr. Martínez pone `clinicamartinez.com`.
2.  **Scraping**: Tu bot entra. Encuentra una página `/servicios`.
3.  **Análisis**: Lee "Fisioterapia Deportiva - 50€".
4.  **Clasificación Inteligente**: El sistema etiqueta esto internamente como `{ type: "service", price: 50, currency: "EUR" }`.
5.  **Vectorización**: Convierte todo eso a números.
6.  **Uso (Chat)**:
    - Usuario: "Soy corredor y me he roto".
    - Agente (Thinking): "Busco servicios relacionados con deporte".
    - Agente (Finding): Encuentra el vector de "Fisioterapia Deportiva".
    - Agente (Answer): _"En la Clínica Martínez somos expertos en deportistas. Ofrecemos Fisioterapia Deportiva por 50€. ¿Te reservo?"_

**Conclusión**: No necesitamos saber la estructura de la web de antemano. Usamos la IA (LLM) durante el proceso de lectura para que ella misma estructure lo que encuentra. **Convertimos el caos de una web en una base de datos ordenada.**
