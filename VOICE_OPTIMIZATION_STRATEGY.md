# ⚡ Voice Agent Latency Optimization Strategy

**Problem**: 3-second delay when voice agents start speaking  
**Goal**: Reduce to <500ms for instant, natural conversation  
**Agents Affected**: Booking Agent, Cart Agent

---

## 🔍 Root Cause Analysis

### Current Flow (3000ms total)

```
User lands on page
    ↓
Component initializes (100ms)
    ↓
setTimeout 800ms delay ⏱️
    ↓
Call backend /generate-greeting (1500ms) ⏱️
    ├─ Network request (200ms)
    ├─ OpenAI TTS API call (1200ms)
    └─ Response download (100ms)
    ↓
Create audio blob (50ms)
    ↓
Play audio (50ms)
    ↓
TOTAL: ~3000ms ❌
```

### Bottlenecks Identified:

1. **800ms artificial delay** (line 293, welcome-chat.component.ts)

   ```typescript
   setTimeout(() => {
     this.playGreeting();
   }, 800);
   ```

2. **Backend TTS latency** (~1500ms)

   - Network round-trip: ~200ms
   - OpenAI TTS generation: ~1200ms
   - Audio download: ~100ms

3. **No preloading** - audio generated on-demand every time

---

## 🎯 Optimization Strategies

### Strategy 1: Pre-generate Common Greetings ⭐ RECOMMENDED

**Impact**: Reduce latency from 3000ms → 300ms (90% improvement)

**Implementation**:

```typescript
// 1. Create static audio files for common greetings
// Run this script once to generate audio files

// scripts/generate-greeting-audio.ts
import { OpenAiProvider } from "./backend/src/core/infrastructure/ai/openai.provider";
import * as fs from "fs";

const greetings = {
  "cart-agent":
    "¡Hola! Soy tu Agente Recuperador de Carritos. Dale a continuar y podrás maximizar las ventas de usuarios que dejaron items en el carrito.",
  "booking-agent": "Clínica Dental Sonrisas. ¿En qué puedo ayudarte?",
  "rider-agent":
    "Hola, soy tu asistente de pedidos. ¿Qué te apetece comer hoy?",
};

async function generateStaticGreetings() {
  const openai = new OpenAiProvider();

  for (const [key, text] of Object.entries(greetings)) {
    const audioBuffer = await openai.generateAudio(text);
    fs.writeFileSync(
      `frontend/src/assets/audio/${key}-greeting.mp3`,
      audioBuffer
    );
    console.log(`✅ Generated: ${key}-greeting.mp3`);
  }
}

generateStaticGreetings();
```

```typescript
// 2. Update VoiceService to use static files

// voice.service.ts
async generateGreeting(text: string, useStatic = true): Promise<Blob> {
  // Check if we have a static file for this exact text
  const staticFile = this.getStaticGreetingFile(text);

  if (useStatic && staticFile) {
    console.log('🎵 Using pre-generated audio file');
    return this.loadStaticAudio(staticFile);
  }

  // Fallback to cache or generation
  return this.generateDynamicGreeting(text);
}

private getStaticGreetingFile(text: string): string | null {
  const greetingMap = {
    '¡Hola! Soy tu Agente Recuperador de Carritos...': 'cart-agent-greeting.mp3',
    'Clínica Dental Sonrisas...': 'booking-agent-greeting.mp3',
    // Add more mappings
  };

  return greetingMap[text] || null;
}

private async loadStaticAudio(filename: string): Promise<Blob> {
  const response = await fetch(`assets/audio/${filename}`);
  return response.blob();
}
```

```typescript
// 3. Update components to remove artificial delay

// welcome-chat.component.ts
constructor() {
  this.updateTime();
  setInterval(() => this.updateTime(), 60000);
  this.orchestrator.activateAgent("abandoned-cart");
  this.loadMetrics();

  // ❌ REMOVE THIS:
  // setTimeout(() => {
  //   this.playGreeting();
  // }, 800);

  // ✅ REPLACE WITH IMMEDIATE CALL:
  this.playGreeting(); // Plays instantly with static file
}
```

**Results**:

- ✅ Latency: 3000ms → 300ms
- ✅ No backend dependency for greetings
- ✅ Works offline
- ✅ Consistent voice quality

---

### Strategy 2: Parallel Loading + Audio Preloading

**Impact**: Reduce latency from 3000ms → 1000ms (67% improvement)

**Implementation**:

```typescript
// voice.service.ts
private preloadQueue = new Map<string, Promise<Blob>>();

// Preload greeting when service initializes
constructor() {
  this.preloadCommonGreetings();
}

private preloadCommonGreetings(): void {
  const commonGreetings = [
    '¡Hola! Soy tu Agente Recuperador de Carritos...',
    'Clínica Dental Sonrisas...',
    // Add more
  ];

  commonGreetings.forEach(text => {
    // Start loading in background
    this.preloadQueue.set(text, this.generateGreeting(text));
  });
}

async generateGreeting(text: string): Promise<Blob> {
  // Check if already preloading
  if (this.preloadQueue.has(text)) {
    console.log('🎵 Using preloaded audio');
    const blob = await this.preloadQueue.get(text)!;
    this.preloadQueue.delete(text);
    return blob;
  }

  // Check cache
  const cacheKey = text.toLowerCase().trim();
  if (this.audioCache.has(cacheKey)) {
    return this.audioCache.get(cacheKey)!;
  }

  // Generate new
  return this.generateDynamicGreeting(text);
}
```

**Results**:

- ✅ Latency: 3000ms → 1000ms (first load)
- ✅ Latency: 3000ms → 50ms (subsequent loads)
- ⚠️ Still requires backend
- ⚠️ Doesn't work offline

---

### Strategy 3: Browser TTS (Instant, but Lower Quality)

**Impact**: Reduce latency from 3000ms → 100ms (97% improvement)

**Implementation**:

```typescript
// voice.service.ts
async generateGreeting(
  text: string,
  preferBrowser = false
): Promise<Blob> {
  // Use browser TTS for instant playback
  if (preferBrowser || !this.isBackendAvailable()) {
    return this.generateBrowserTTS(text);
  }

  // Use backend for better quality
  return this.generateBackendTTS(text);
}

private async generateBrowserTTS(text: string): Promise<Blob> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    // Find best Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v =>
      v.lang.includes('es') &&
      (v.name.includes('Google') || v.name.includes('Monica'))
    );

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    // Browser TTS doesn't return blob, so return empty
    // and speak directly
    window.speechSynthesis.speak(utterance);
    resolve(new Blob());
  });
}

private isBackendAvailable(): boolean {
  // Check if backend is reachable
  return navigator.onLine && this.backendHealthy;
}
```

**Results**:

- ✅ Latency: 3000ms → 100ms
- ✅ Works offline
- ✅ No backend cost
- ❌ Voice quality varies by browser
- ❌ Robotic on some systems

---

### Strategy 4: Hybrid Approach ⭐ BEST BALANCE

**Combine strategies for optimal UX**

```typescript
// voice.service.ts
async speak(text: string, options: VoiceOptions = {}): Promise<void> {
  const {
    preferQuality = false,
    allowFallback = true,
    maxLatency = 1000
  } = options;

  // 1. Try static file first (instant)
  const staticFile = this.getStaticGreetingFile(text);
  if (staticFile) {
    const blob = await this.loadStaticAudio(staticFile);
    this.playAudioBlob(blob);
    return;
  }

  // 2. Check cache (instant)
  if (this.audioCache.has(text)) {
    const blob = this.audioCache.get(text)!;
    this.playAudioBlob(blob);
    return;
  }

  // 3. Race between backend and browser TTS
  if (!preferQuality) {
    const browserPromise = this.speakWithBrowser(text);
    const backendPromise = this.generateBackendTTS(text);

    // Start browser TTS immediately
    browserPromise.then(() => {
      console.log('🎵 Playing with browser TTS');
    });

    // If backend responds quickly, switch to it
    const timeout = new Promise(resolve =>
      setTimeout(resolve, maxLatency)
    );

    const backendResult = await Promise.race([
      backendPromise,
      timeout
    ]);

    if (backendResult) {
      // Stop browser TTS and play backend audio
      window.speechSynthesis.cancel();
      this.playAudioBlob(backendResult as Blob);
      console.log('🎵 Switched to backend TTS');
    }
  } else {
    // Quality mode: wait for backend
    const blob = await this.generateBackendTTS(text);
    this.playAudioBlob(blob);
  }
}
```

**Results**:

- ✅ Instant playback with browser TTS
- ✅ Upgrades to high-quality if backend is fast
- ✅ Graceful degradation
- ✅ Best user experience

---

## 🚀 Implementation Plan

### Phase 1: Quick Wins (1-2 hours)

1. **Remove artificial delays**

   ```typescript
   // welcome-chat.component.ts, line 293
   // ❌ Remove: setTimeout(() => this.playGreeting(), 800);
   // ✅ Replace: this.playGreeting();
   ```

2. **Enable audio caching** (already implemented, verify it works)
   ```typescript
   // voice.service.ts - verify cache is working
   console.log("Cache size:", this.voiceService.getCacheSize());
   ```

**Expected Result**: 3000ms → 2200ms (27% improvement)

---

### Phase 2: Pre-generate Static Files (2-3 hours)

1. **Create generation script**

   ```bash
   # Create script
   touch scripts/generate-greeting-audio.ts

   # Run script
   npm run generate:greetings
   ```

2. **Add static files to assets**

   ```
   frontend/src/assets/audio/
   ├── cart-agent-greeting.mp3
   ├── booking-agent-greeting.mp3
   └── rider-agent-greeting.mp3
   ```

3. **Update VoiceService** to check static files first

**Expected Result**: 3000ms → 300ms (90% improvement)

---

### Phase 3: Implement Hybrid Strategy (4-5 hours)

1. **Add browser TTS fallback**
2. **Implement race condition** between browser and backend
3. **Add quality preference** setting

**Expected Result**:

- First play: 100ms (browser) → 300ms (upgrade to backend)
- Subsequent: 50ms (cache)

---

## 📊 Performance Comparison

| Strategy          | First Load  | Cached | Offline | Quality    | Complexity |
| ----------------- | ----------- | ------ | ------- | ---------- | ---------- |
| **Current**       | 3000ms      | 3000ms | ❌      | ⭐⭐⭐⭐⭐ | Low        |
| **Remove Delays** | 2200ms      | 2200ms | ❌      | ⭐⭐⭐⭐⭐ | Very Low   |
| **Static Files**  | 300ms       | 300ms  | ✅      | ⭐⭐⭐⭐⭐ | Medium     |
| **Preloading**    | 1000ms      | 50ms   | ❌      | ⭐⭐⭐⭐⭐ | Medium     |
| **Browser TTS**   | 100ms       | 100ms  | ✅      | ⭐⭐       | Low        |
| **Hybrid**        | 100ms→300ms | 50ms   | ✅      | ⭐⭐⭐⭐   | High       |

---

## 🎯 Recommended Approach

### For Immediate Fix (Today):

1. **Remove `setTimeout` delays** (5 minutes)
2. **Verify cache is working** (5 minutes)

### For Best Long-term Solution (This Week):

1. **Generate static greeting files** (2 hours)
2. **Update VoiceService** to use static files (1 hour)
3. **Test across all agents** (1 hour)

### For Ultimate UX (Next Sprint):

1. **Implement hybrid strategy** (4 hours)
2. **Add quality settings** (2 hours)
3. **Add performance monitoring** (2 hours)

---

## 🧪 Testing Checklist

- [ ] Test on slow 3G network
- [ ] Test with backend offline
- [ ] Test cache persistence across page reloads
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices
- [ ] Measure actual latency with Performance API
- [ ] Test with multiple rapid plays (race conditions)

---

## 📈 Success Metrics

**Before**:

- Time to first audio: 3000ms
- User perception: "Slow, unresponsive"
- Bounce rate: Unknown

**After (Target)**:

- Time to first audio: <500ms
- User perception: "Instant, natural"
- Bounce rate: Reduced by 20%

---

## 🔧 Code Examples

### Example 1: Remove Delays

```typescript
// ❌ BEFORE (welcome-chat.component.ts)
constructor() {
  this.updateTime();
  setInterval(() => this.updateTime(), 60000);
  this.orchestrator.activateAgent("abandoned-cart");
  this.loadMetrics();

  setTimeout(() => {
    this.playGreeting();
  }, 800); // ❌ Artificial delay
}

// ✅ AFTER
constructor() {
  this.updateTime();
  setInterval(() => this.updateTime(), 60000);
  this.orchestrator.activateAgent("abandoned-cart");
  this.loadMetrics();

  // Play immediately
  this.playGreeting();
}
```

### Example 2: Static File Loading

```typescript
// voice.service.ts
private staticGreetings = {
  'cart-agent': 'assets/audio/cart-agent-greeting.mp3',
  'booking-agent': 'assets/audio/booking-agent-greeting.mp3',
  'rider-agent': 'assets/audio/rider-agent-greeting.mp3'
};

async generateGreeting(text: string, agentType?: string): Promise<Blob> {
  // Try static file first
  if (agentType && this.staticGreetings[agentType]) {
    try {
      const response = await fetch(this.staticGreetings[agentType]);
      if (response.ok) {
        console.log('🎵 Using static greeting file');
        return await response.blob();
      }
    } catch (error) {
      console.warn('Static file not found, falling back to generation');
    }
  }

  // Fallback to cache or generation
  return this.generateDynamicGreeting(text);
}
```

### Example 3: Performance Monitoring

```typescript
// Add to playGreeting method
private async playGreeting() {
  const startTime = performance.now();

  try {
    this.isAgentSpeaking.set(true);
    const greetingText = "¡Hola! Soy tu Agente...";

    const audioBuffer = await this.voiceService.generateGreeting(
      greetingText,
      'cart-agent' // Pass agent type for static file lookup
    );

    const latency = performance.now() - startTime;
    console.log(`⏱️ Voice latency: ${latency.toFixed(0)}ms`);

    // Track in analytics
    this.analytics.track('voice_latency', {
      agent: 'cart',
      latency,
      method: audioBuffer.size > 0 ? 'backend' : 'browser'
    });

    this.greetingAudio = this.voiceService.playAudioBlob(audioBuffer);
    this.greetingAudio.onended = () => {
      this.isAgentSpeaking.set(false);
    };
  } catch (error) {
    console.error("Error playing greeting:", error);
    this.isAgentSpeaking.set(false);
  }
}
```

---

**Next**: See `VOICE_NATURALNESS_STRATEGY.md` for improving voice quality
