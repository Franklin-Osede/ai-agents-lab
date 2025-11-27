# AI Agents Lab

Professional AI agents laboratory for business automation. Built with Clean Architecture, TDD, and Domain-Driven Design.

## 🏗️ Project Structure

```
ai-agents-lab/
├── backend/          # NestJS API
│   ├── src/
│   ├── package.json
│   └── ...
│
└── frontend/         # Angular Application
    ├── src/
    ├── package.json
    └── ...
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
npm run start:dev
# API Docs: http://localhost:3000/api/docs
```

### Frontend

```bash
cd frontend
npm install
ng serve
# App: http://localhost:4200
```

## 📦 Stack

### Backend
- NestJS + TypeScript
- Clean Architecture
- TDD with Jest
- Swagger API Documentation
- Docker support

### Frontend
- Angular + TypeScript
- SCSS
- Interactive agent demos
- Real-time metrics

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:cov

# Frontend tests
cd frontend
ng test
```

## 🐳 Docker

```bash
cd backend
docker-compose up -d
```

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture decisions
- [NEXT_STEPS_COMPLETE.md](./NEXT_STEPS_COMPLETE.md) - Development roadmap
- [FRONTEND_STRATEGY.md](./FRONTEND_STRATEGY.md) - Frontend implementation guide

## 🔗 Links

- GitHub: https://github.com/Franklin-Osede/ai-agents-lab
- API Documentation: http://localhost:3000/api/docs (when running)
