# 📱 Ultimate Frontend Prompt: Rider Agent Dashboard

**Role:** Senior Product Designer & Frontend Architect
**Context:** We are building the "Control Tower" for a Logistics AI. It needs to look like a sci-fi/premium command center.

## 🎨 Global Design System

- **Theme:** "Modern Premium" (Apple-esque Minimalism).
- **Backgrounds:** Clean White with lots of Whitespace.
- **Accents:** Deep Indigo (`#4F46E5`) for primary actions, Energetic Orange (`#F97316`) for active status.
- **Typography:** 'Inter' or 'Plus Jakarta Sans' (Bold headings, clean body).
- **Components:**
  - **Cards:** High-end feel, soft elevation (no hard borders).
  - **Interactions:** Smooth micro-animations for hover/click states.
  - **Vibe:** Think "Stripe Dashboard" mixed with "Uber".

## 🖥️ Screen List & Functionalities

### 1. **Login & Onboarding (The Portal)**

- **Visual:** Clean, centered card on a blurred map background.
- **Functionality:**
  - Email/Password Login.
  - "Demo Mode" toggle (Bypasses login, loads simulation data).
  - **WOW Factor:** When logging in, the background map zooms into the user's city.

### 2. **The "Control Tower" (Main Dashboard)**

- **Layout:** Full-screen Map with floating panels.
- **Functionality:**
  - **Live Map:** Shows all active riders as moving icons (Motorcycles).
  - **Cluster View:** If zoomed out, group riders (e.g., "5 Riders in Downtown").
  - **Rider Sidebar (Right):** List of all fleets.
    - _Status Pills:_ "On Delivery", "Idle", "Offline".
    - _Battery/Phone Stats:_ (e.g., "🔋 85%").
  - **AI Terminal (Bottom Left):** A transparent console showing real-time AI logic.
    - `> Analyzing traffic patterns...`
    - `> Rider #12 delayed (+5m). Notification sent to customer.`

### 3. **Rider Detail View (Drill-Down)**

- **Trigger:** Click on a Rider Marker or Sidebar Item.
- **Visual:** Replaces the Sidebar with a detailed profile.
- **Data:**
  - **Profile:** Photo, Name, Vehicle Type.
  - **Current Metrics:** Speed, Earnings Today, Orders Completed.
  - **Live Feed:** History of location pings.
  - **Action Buttons:**
    - 📞 "Voice Connect" (Bridge call).
    - 💬 "Message" (AI acts as middleman).

### 4. **Order Management Panel**

- **Trigger:** Tab switcher "Fleet" vs "Orders".
- **Functionality:**
  - List of active orders.
  - **Drag & Drop Dispatch:** Drag an "Unassigned Order" onto a "Rider" to assign it.
  - **Status Timeline:** `Created -> Prepared -> Picked Up -> Delivering -> Delivered`.

### 5. **Settings & Configuration**

- **Functionality:**
  - **AI Personality:** Slider for "Strictness" (How fast to nag riders?).
  - **Zones:** Draw polygon zones on the map for "Delivery Areas".
  - **Alert Thresholds:** "Notify me if rider stops for > X minutes".

## 🛠️ Technical Implementation Notes

- **Map Engine:** Use `Leaflet` (ngx-leaflet) with a clean light tile layer (e.g., CartoDB Positron or OpenStreetMap Standard).
- **Real-time:** Connect to `ws://localhost:3000/rider` for live updates.
- **State:** Use a Signal Store (NgRx SignalStore) or BehaviorSubject for fleet state.
