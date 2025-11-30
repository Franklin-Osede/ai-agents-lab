# Frontend Structure - Quick Reference

## Recommended Approach: **Modal-Based Interactive Demo**

### Why Modal?
- ✅ Keeps user on same page
- ✅ Fast switching between agents
- ✅ Professional appearance
- ✅ Easy to implement
- ✅ Great for portfolio

## Component Hierarchy

```
app.component
├── landing-page.component
│   ├── hero-section.component
│   ├── agent-card.component (x3)
│   │   └── [Click] → Opens demo-modal
│   └── features-section.component
│
└── demo-modal.component (shared)
    ├── chat-interface.component
    │   ├── message-bubble.component
    │   └── message-input.component
    ├── metrics-panel.component
    └── code-view.component (optional)
```

## Agent Cards Design

Each card should show:
- 🎨 Visual/Icon
- 📝 Agent name
- 💡 Short description (1 line)
- ✨ Key features (3 bullet points)
- ▶️ "Try It Now" button
- 📊 "View Metrics" button

## Demo Modal Content

When user clicks "Try It Now":
1. Modal opens (smooth animation)
2. Shows chat interface
3. User can type messages
4. Agent responds in real-time
5. Metrics update live
6. Can close and try another agent

## Implementation Priority

1. **Phase 1:** Basic landing page + agent cards
2. **Phase 2:** Modal with chat interface
3. **Phase 3:** API integration
4. **Phase 4:** Metrics panel
5. **Phase 5:** Polish & animations

