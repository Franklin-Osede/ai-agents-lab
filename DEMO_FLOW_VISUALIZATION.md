# Visual Flow: The "Magic" Onboarding Experience

This diagram illustrates how a single entry point (Scraping) visually transforms into a tailored experience for each niche.

```mermaid
graph TD
    %% --- STEP 1: UNIVERSAL ENTRY ---
    Stats[Start: Marketing Landing Page] --> Input{"Input: URL / Instagram"}
    Input -->|User pastes URL| Scraper[🤖 AI Auto-Scraper]

    %% --- STEP 2: INTELLIGENT ROUTING (The "Wow" Moment) ---
    Scraper --> Classifier{🧠 AI Niche Detector}

    %% --- STEP 3: THE FORK (Visual Transformation) ---

    %% Path A: CLINICS
    Classifier -->|Detects: 'Doctor', 'Dental', 'Health'| A[🏥 HEALTH MODE]
    A --> A_Dash[<b>Visual:</b> Clean White/Blue Medical Dashboard]
    A_Dash --> A_KPI1[KPI: Emergency Triage]
    A_Dash --> A_KPI2[KPI: Insurance Validated]
    A_Dash --> A_Chat[Chat Bot: 'Nurse Persona']

    %% Path B: BEAUTY
    Classifier -->|Detects: 'Salon', 'Hair', 'Nails'| B[💇‍♀️ BEAUTY MODE]
    B --> B_Dash[<b>Visual:</b> Chic Black/Gold or Pastel Dashboard]
    B_Dash --> B_KPI1[KPI: Product Upsell (+€)]
    B_Dash --> B_KPI2[KPI: Visual Look History]
    B_Dash --> B_Chat[Chat Bot: 'Stylist Persona']

    %% Path C: LEGAL/PROdame un 
    Classifier -->|Detects: 'Law', 'Tax', 'Consulting'| C[⚖️ PROFESSIONAL MODE]
    C --> C_Dash[<b>Visual:</b> Serious Navy/Grey Dashboard]
    C_Dash --> C_KPI1[KPI: Document Status]
    C_Dash --> C_KPI2[KPI: Billable Hours Saved]
    C_Chat[Chat Bot: 'Executive Assistant']

    %% --- STEP 4: THE DEMO INTERACTION ---
    A_Dash & B_Dash & C_Dash --> DemoAction[User types in Chat Simulator]
    DemoAction -->|Real-time SSE| LiveUpdate[✨ Cards Flip & Numbers Update Instantly]
```

## How it looks to the User (Step-by-Step)

### 1. The "Loading" Screen (Building Anticipation)

- **Visual:** A progress bar scanning their website.
- **Text:** _"Reading your service menu... Analyzing pricing... Detecting business type..."_
- **Pop-up:** _"Detected: Dental Clinic. Loading Medical Modules..."_ (This confirms intelligence).

### 2. The Reveal (The Dashboard)

Unlike a generic tool, the dashboard loads **pre-populated** with their likely reality.

- **If Dentist:** They see a "Patient Triage" column.
- **If Salon:** They see a "Product Recommendations" column.
- **If Lawyer:** They see a "Document Checklist" column.

### 3. The "Try It" Moment

The user sends a test message. The dashboard reacts **specifically to their niche**.

- **Dentist Test:** "I have pain." -> Dashboard flashes **URGENCY**.
- **Salon Test:** "I want red nails." -> Dashboard shows **INVENTORY CHECK**.

This structure proves you "understand their world" without them configuring anything.
