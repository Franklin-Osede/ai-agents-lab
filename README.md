# AI Agents Lab

AI agents laboratory for business automation. Professional architecture with Clean Architecture, TDD, and Domain-Driven Design.

## 🏗️ Architecture

This project follows a **Modular Monorepo** architecture:

```
src/
├── core/              # Shared infrastructure (AI, DB, etc.)
├── agents/            # Each agent is an independent module
│   ├── booking-agent/
│   ├── dm-response-agent/
│   └── follow-up-agent/
└── shared/            # Shared services between agents
```

### Design Principles

- ✅ **Single Monorepo**: Shares common code, easy to maintain
- ✅ **Independent Modules**: Each agent can work standalone
- ✅ **Clean Architecture**: Clear layer separation (domain, application, presentation)
- ✅ **TDD**: Test-Driven Development
- ✅ **Scalable**: Easy to add new agents

## 🧪 Testing

- **TDD** (Test-Driven Development)
- **Unit Tests**: Business logic
- **Integration Tests**: APIs and services
- **E2E Tests**: Complete flows

## 🚀 Implemented Agents

### Core Agents (v1.0)
1. **Booking Agent** - Automatic appointment bookings
2. **DM Response Agent** - Automatic message responses (Instagram/WhatsApp)
3. **Follow-up Agent** - Automated commercial follow-up

## 📦 Stack Tecnológico

- **Backend**: NestJS + TypeScript
- **Frontend**: Angular + TypeScript
- **Testing**: Jest + Supertest
- **AI**: OpenAI API
- **Database**: PostgreSQL (Supabase)
- **Architecture**: Clean Architecture + DDD

## 🚀 Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Run tests
npm test

# Start development
npm run start:dev
```

## 📖 Agent Structure

Each agent follows this structure:

```
agent-name/
├── domain/              # Entities and business logic
│   ├── entities/
│   └── interfaces/
├── application/         # Use cases and services
│   └── services/
└── presentation/        # Controllers and DTOs
    └── dto/
```

## 🎯 Next Steps

- [ ] Implement automated outreach system
- [ ] Personalized landing pages per prospect
- [ ] Metrics and analytics dashboard
- [ ] Integrations with Google Calendar, CRM, etc.

## 📝 Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details about the architecture.
