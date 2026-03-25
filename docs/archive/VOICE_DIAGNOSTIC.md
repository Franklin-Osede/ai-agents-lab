# Voice Quality Diagnostic Plan

## Problem Statement

- **Abandoned Cart**: ✅ Neural voice, natural breathing (WORKS PERFECTLY)
- **Rider Agent**: ❌ Robotic voice
- **Booking Agent**: ❌ Robotic voice + hardcoded "Dr. Ramírez"

## Hypothesis

Despite code showing `PollyTTSService` injection, the audio might be:

1. Not reaching the backend at all (using browser fallback)
2. Reaching backend but frontend playing wrong audio source
3. Using a different code path we haven't updated

## Diagnostic Steps

### 1. Check Backend Logs (NOW)

Look for `/api/v1/voice/speak` requests when using Rider Agent.

- **If NO requests**: Frontend is NOT calling Polly
- **If YES requests**: Frontend IS calling Polly but something else is wrong

### 2. Check Browser Console (USER)

User should open DevTools and look for:

```
[PollyTTS] Assigned Voice for this session: Lucia
[PollyTTS] 🎤 Speaking: "..."
[PollyTTS] ⚡ Loaded in XXms
```

- **If NOT present**: PollyTTSService not being used
- **If present**: Service is used but audio quality issue

### 3. Possible Root Causes

#### A. Demo Modal Using Old VoiceService

- Found: `demo-modal.component.ts` line 154 uses `VoiceService`
- This is for STT (recording), not TTS
- Need to check if demo modal has TTS at all

#### B. Browser TTS Fallback

- Check if there's a try/catch that falls back to browser TTS
- Check if PollyTTSService.speak() is actually async and being awaited

#### C. Audio Source Confusion

- Multiple audio elements playing simultaneously?
- Old audio element not being stopped?

## Next Actions

1. Get backend logs during Rider Agent interaction
2. Get browser console logs during Rider Agent interaction
3. Compare with Abandoned Cart (which works)
4. Fix the root cause
