# Project Architecture

## Structure: Modular Monorepo

This project follows a **single monorepo** architecture with **independent modules** for each agent.

### Why Monorepo instead of Multi-repo?

✅ **Monorepo Advantages:**
- Shares common code (domain, infrastructure) → DRY
- Easy refactoring between agents
- Shared testing
- Coordinated deployment
- Better for portfolio (shows organization)
- Single `package.json` → less duplication

❌ **Multi-repo Disadvantages:**
- Common code duplication
- More complex to maintain
- Difficult to share types/interfaces
- More repositories to manage

### Folder Structure

```
ai-agents-lab/
├── src/
│   ├── core/                    # Shared code (domain + infrastructure)
│   │   ├── domain/              # Entities and business logic
│   │   │   ├── shared/          # Shared entities
│   │   │   └── agents/          # Agent-specific entities
│   │   └── infrastructure/      # Technical implementations
│   │       ├── ai/              # AI providers
│   │       ├── database/        # DB implementations
│   │       └── external/        # External APIs
│   │
│   ├── agents/                   # Each agent is an independent module
│   │   ├── booking-agent/
│   │   │   ├── domain/          # Agent-specific domain
│   │   │   ├── application/     # Agent use cases
│   │   │   └── presentation/    # Controllers, DTOs
│   │   │
│   │   ├── dm-response-agent/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   └── presentation/
│   │   │
│   │   └── follow-up-agent/
│   │       ├── domain/
│   │       ├── application/
│   │       └── presentation/
│   │
│   └── shared/                   # Shared utilities
│       ├── decorators/
│       ├── guards/
│       ├── interceptors/
│       └── utils/
│
├── frontend/                     # Angular app
│   └── src/
│       ├── app/
│       │   ├── agents/          # Components per agent
│       │   └── shared/           # Shared components
│
└── tests/                        # Shared E2E tests
```

### Design Principles

1. **Agent Independence**: Each agent can work standalone
2. **Shared Code**: Domain and Infrastructure are reused
3. **Clean Architecture**: Clear layer separation
4. **TDD**: Tests before implementation
5. **Scalability**: Easy to add new agents

### How to Add a New Agent

1. Create folder in `src/agents/new-agent/`
2. Implement domain, application, presentation
3. Import module in `app.module.ts`
4. Add tests
5. Document in README

### Deployment

Each agent can be deployed independently using:
- Separate Docker containers
- Serverless functions (AWS Lambda, Cloud Functions)
- Or as a single modular monolithic service


