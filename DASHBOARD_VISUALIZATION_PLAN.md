# Dashboard Visualization Strategy: "The Live Matrix"

This document defines the specific "Live Events" we will visualize for each Agent Type to close sales.

## 1. Booking Agent (Niches) 📅

The core value is **"Business on Autopilot"**. The dashboard must show revenue being generated or chaos being organized.

### 🦷 Dental / Medical / Physio

- **Event A: The Revenue Rescue**
  - **Chat Action:** "Me duele mucho, es urgente."
  - **Dashboard Visual:** 🚨 **URGENCY ALERT** (Blinking Red).
  - **Data:** "High Priority Patient - Auto-routed to Dr. Smith's emergency slot."
- **Event B: Insurance Validation**
  - **Chat Action:** "Tengo Adeslas."
  - **Dashboard Visual:** ✅ **INSURANCE VERIFIED** (Green Badge).
  - **Data:** "Coverage: 100%. Copay: 0€. Pre-auth code: #12345."
- **Event C: The Upsell**
  - **Chat Action:** "Quiero limpieza." -> Bot: "¿Te blanqueas también?" -> User: "Venga vale."
  - **Dashboard Visual:** 💰 **UPSELL SUCCESS** (Gold Animation).
  - **Data:** "+150€ added to ticket."

### ⚖️ Legal / Professional

- **Event A: Document Ingestion**
  - **Chat Action:** User uploads PDF.
  - **Dashboard Visual:** 📄 **FILE RECEIVED** (Paper Fly-in Animation).
  - **Data:** "DNI_Cliente.pdf saved to /Expedientes/2026."
- **Event B: Lead Qualification**
  - **Chat Action:** "Quiero divorciarme, tenemos 3 casas y empresa."
  - **Dashboard Visual:** 🔥 **HIGH VALUE LEAD** (Fire Icon).
  - **Data:** "Estimated Fees: >5.000€."

### 💇‍♀️ Beauty / Salon

- **Event A: Stock Check**
  - **Chat Action:** "Quiero tinte azul."
  - **Dashboard Visual:** 📦 **INVENTORY CHECK** (Box Icon).
  - **Data:** "Stock: 2 units left. 1 Reserved for appointment."
- **Event B: Smart Scheduling**
  - **Chat Action:** "Solo puedo el martes."
  - **Dashboard Visual:** 🧩 **YIELD OPTIMIZATION**.
  - **Data:** "Filled 30min gap between colors. Efficiency +15%."

---

## 2. Rider Agent (Delivery & Logistics) 🛵

The core value is **"Speed & Precision"**. The dashboard must look like a **Command Center**.

- **Event A: Dynamic Route Optimization**
  - **Chat Action:** Rider: "Tengo un paquete extra."
  - **Dashboard Visual:** 🗺️ **ROUTE UPDATED** (Map Path Change).
  - **Data:** "New ETA: 14:15. Saved 2km."
- **Event B: Issue Resolution**
  - **Chat Action:** Rider: "Nadie abre la puerta." -> Bot: "Llamando al cliente..."
  - **Dashboard Visual:** ⚠️ **INTERVENTION AUTO-SOLVED**.
  - **Data:** "Client contacted via VoIP. Door code provided. Rider proceeding."
- **Event C: Proof of Delivery**
  - **Chat Action:** Rider sends photo.
  - **Dashboard Visual:** 📸 **DELIVERY CONFIRMED**.
  - **Data:** "Photo match: 99%. GPS validated."

---

## 3. Abandoned Cart Agent (E-commerce) 🛒

The core value is **"Recovered Money"**. The dashboard must look like a **Stock Ticker**.

- **Event A: The Hook**
  - **Trigger:** User leaves checkout ($200).
  - **Dashboard Visual:** 🎣 **CART DETECTED**.
  - **Data:** "Value: $200. Strategy: 'Soft Nudge' (No discount yet)."
- **Event B: Objection Handling**
  - **Chat Action:** User: "Es muy caro." -> Bot: "Te doy 5% si compras YA."
  - **Dashboard Visual:** 🧠 **NEGOTIATION ACTIVE**.
  - **Data:** "Objection: Price. Offer: 5% Coupon deployed."
- **Event C: The Recovery**
  - **Chat Action:** User: "Vale, comprado."
  - **Dashboard Visual:** 🤑 **RECOVERY SUCCESS** (Cash Register Sound/Visual).
  - **Data:** "Recovered: $190. ROI on agent cost: 50x."

---

## Implementation Strategy (Technically)

We already have the SSE pipe (`/dashboard/events`). For each of these scenarios, we just need to:

1.  Add the logic to `MockToolExecutor` (or the specific agent executor).
2.  Emit the specific event (e.g., `emit('cart_recovered', { amount: 190 })`).
3.  Frontend: Build a generic "Event Card" component that styles itself based on the event type (Urgency = Red, Money = Green).
