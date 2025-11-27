# 📁 Project Structure

## Current Organization

```
ai-agents-lab/
├── backend/              # NestJS Backend API
│   ├── src/
│   │   ├── agents/       # 3 AI agents
│   │   ├── core/         # Shared infrastructure
│   │   └── shared/       # Shared services
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── frontend/             # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── shared/
│   │   │   └── agents/
│   ├── package.json
│   └── ...
│
└── README.md
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run start:dev
# API: http://localhost:3000/api/docs
```

### Frontend
```bash
cd frontend
npm install
ng serve
# App: http://localhost:4200
```

## ✅ Status

- ✅ Backend compiles successfully
- ✅ All files organized correctly
- ✅ Git repository updated

