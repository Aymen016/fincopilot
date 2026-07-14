<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/SQLite-aiosqlite-003B57?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/Ollama-LLaMA_3.2-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Currency-PKR-1a7f37?style=for-the-badge" />
</p>

<h1 align="center">💰 FinCopilot</h1>
<p align="center"><b>AI-powered personal finance manager built for Pakistani Rupees</b></p>
<p align="center">Track expenses · Set budgets · Chase savings goals · Get AI insights · Chat with your finances</p>

---

## ✨ Features

| Category | What it does |
|---|---|
| **Expense Tracking** | Add, edit, delete expenses with categories, merchant, and date |
| **CSV Import** | Bulk upload expenses via CSV file |
| **Budget Management** | Set monthly spending limits per category with real-time gauge tracking |
| **Savings Goals** | Create goals with target amounts and dates, make deposits, track progress |
| **AI Insights Engine** | Rule-based engine that analyses real spending data and fires actionable insights |
| **Spending Forecast** | Projects next month's spending by category using historical averages |
| **Financial Health Score** | Composite score (0–100) graded A–F across savings rate, budget adherence, and more |
| **AI Chat Assistant** | Ask natural language questions about your finances — powered by local LLaMA 3.2 via Ollama |
| **PKR Currency** | All amounts formatted in Pakistani Rupees (₨) — built for local use |

---
<img width="3411" height="1284" alt="Main Dashboard - Lighter UI" src="https://github.com/user-attachments/assets/4748168f-10a1-4eb9-881a-8f773d769551" />

---
## 🖼️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14 (App Router)  ·  Tailwind CSS  ·  SWR           │
│  Recharts  ·  React Hook Form  ·  Zod  ·  Zustand           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP + WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                         BACKEND                              │
│  FastAPI  ·  SQLAlchemy (async)  ·  aiosqlite  ·  Pydantic  │
│  JWT Auth  ·  Alembic migrations  ·  httpx                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (localhost:11434)
┌─────────────────────────▼───────────────────────────────────┐
│                      AI LAYER (local)                        │
│  Ollama  ·  LLaMA 3.2 (3B)  ·  Rule-based insights engine  │
└─────────────────────────────────────────────────────────────┘
```

---

## ☁️ Deployment Architecture

In production, the three tiers run on separate free-tier platforms:

```
Browser (Vercel frontend)
        ↓  API calls (HTTPS + WebSocket)
FastAPI backend (Hugging Face Space)
        ↓  DATABASE_URL
PostgreSQL database (Supabase)  ← this is where data is stored
```

| Tier | Platform | Notes |
|------|----------|-------|
| **Frontend** | Vercel | Next.js app; set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to the backend URL |
| **Backend** | Hugging Face Spaces (Docker) | FastAPI via `uvicorn`; serves REST + WebSocket |
| **Database** | Supabase (PostgreSQL) | Connect via the async pooler string (`postgresql+asyncpg://...pooler.supabase.com:5432/...`) |

> **Note:** Supabase free-tier projects auto-pause after 7 days of inactivity. If the backend fails to start with a `tenant/user ... not found` error, resume the project from the Supabase dashboard and restart the Space.
>
> **AI chat in production:** Ollama runs locally only, so it isn't available on the deployed backend. The chat panel detects this via `/api/v1/ai/status` and degrades gracefully to an "AI offline" state — everything else keeps working.

---

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Ollama | latest | [ollama.com/download](https://ollama.com/download) |

---

### 1 · Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/fincopilot.git
cd fincopilot
```

### 2 · Backend setup

```bash
cd fincopilot-backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp ../env.example .env        # edit values as needed

# Start the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend runs at **http://localhost:8000** · Swagger docs at **http://localhost:8000/docs**

### 3 · Frontend setup

```bash
cd fincopilot-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at **http://localhost:3000**

### 4 · AI Chat (optional)

```bash
# Install Ollama from https://ollama.com/download, then:
ollama pull llama3.2
ollama serve
```

Once running, click **"AI Assistant"** in the sidebar to chat with your finances.

### 5 · Seed demo data (optional)

```bash
cd fincopilot-backend
python seed_test_data.py
```

Seeds 32 realistic PKR-denominated expenses, 7 budgets, 3 savings goals, and sets monthly income to PKR 150,000.

---

## 📁 Project Structure

```
fincopilot/
├── fincopilot-backend/
│   ├── app/
│   │   ├── ai/                  # Insights engine, forecaster, chat agent
│   │   │   ├── insights_engine.py   # Rule-based insight generation
│   │   │   ├── forecaster.py        # Spending prediction
│   │   │   ├── health_scorer.py     # Composite financial health score
│   │   │   └── chat_agent.py        # Ollama-powered chat with DB context
│   │   ├── api/v1/              # REST + WebSocket endpoints
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── repositories/        # Data access layer
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   └── utils/               # JWT, security, CSV parser
│   ├── seed_test_data.py
│   └── requirements.txt
│
├── fincopilot-frontend/
│   ├── app/
│   │   ├── (auth)/              # Login & Register pages
│   │   └── (dashboard)/         # Dashboard, Expenses, Budgets, Goals, etc.
│   ├── components/
│   │   ├── ai/                  # InsightCard, ChatPanel
│   │   ├── charts/              # SpendingDonut, TrendLine, BudgetGauge, HealthScoreRing
│   │   └── goals/               # GoalCard
│   ├── hooks/                   # useChat (WebSocket)
│   ├── lib/                     # apiClient, auth store, websocket, utils
│   └── tailwind.config.js
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/token` | Login — returns JWT |
| `POST` | `/api/v1/auth/register` | Register new user |
| `GET` | `/api/v1/auth/me` | Current user profile |
| `GET/POST` | `/api/v1/expenses` | List / create expenses |
| `PATCH/DELETE` | `/api/v1/expenses/{id}` | Update / delete expense |
| `POST` | `/api/v1/expenses/bulk` | CSV bulk import |
| `GET` | `/api/v1/categories` | All categories |
| `GET/POST` | `/api/v1/budgets` | List / create budgets |
| `DELETE` | `/api/v1/budgets/{id}` | Delete budget |
| `GET/POST` | `/api/v1/goals` | List / create savings goals |
| `PATCH` | `/api/v1/goals/{id}` | Edit goal |
| `PATCH` | `/api/v1/goals/{id}/deposit` | Deposit into goal |
| `GET` | `/api/v1/insights` | AI-generated spending insights |
| `GET` | `/api/v1/forecast/monthly` | Next month spending forecast |
| `GET` | `/api/v1/forecast/risk` | Budget risk flags |
| `GET` | `/api/v1/health-score` | Financial health score |
| `WS` | `/ws/chat?token=` | Real-time AI chat (WebSocket) |

Full interactive docs: **http://localhost:8000/docs**

---

## 🧠 How the AI Works

FinCopilot uses **two AI layers** — neither requires a paid API:

### 1. Rule-Based Insights Engine
Analyses the last 90 days of spending and fires insights when conditions are met:

```
dining/outing > 25% of total spend    →  "You're spending heavily on dining out"
savings rate < 10%                    →  "Your savings rate is below the 10% target"
weekend spend > 1.8× weekday          →  "Weekend spending is X× your weekday average"
same description across 2+ months     →  "Found recurring charge — review for duplicates"
any budget category over limit        →  "You've exceeded budget in: Housing, Shopping"
monthly spend trending up > 15%       →  "Spending has increased X% over 3 months"
```

Insights are cached for 1 hour and invalidated immediately on any expense change.

### 2. Local LLM Chat (Ollama + LLaMA 3.2)
Before each chat response, the agent fetches your real financial data:
- Last 90 days of expenses (by category)
- Budget vs. actual for the current month
- Active savings goals + progress
- Monthly income

This context is injected into the LLM prompt so it answers questions specific to **your** numbers — not generic advice.

---

## 🌍 Environment Variables

Copy `.env.example` to `.env` in the root and configure:

```env
# Backend
SECRET_KEY=your-secret-key-here-minimum-32-chars
DATABASE_URL=sqlite+aiosqlite:///./fincopilot.db

# Optional: AI (not required — Ollama is used locally)
ANTHROPIC_API_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Production values

When deployed (Vercel + Hugging Face + Supabase), use these instead:

```env
# Backend (set on the Hugging Face Space → Settings → Variables and secrets)
SECRET_KEY=<random 32+ char string>
DATABASE_URL=postgresql+asyncpg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
ENVIRONMENT=production
ALLOWED_ORIGINS=https://<your-app>.vercel.app

# Frontend (set on Vercel → Settings → Environment Variables) — no /api/v1 suffix
NEXT_PUBLIC_API_URL=https://<username>-<space>.hf.space
NEXT_PUBLIC_WS_URL=wss://<username>-<space>.hf.space
```

---

## 🐳 Docker (coming soon)

```bash
docker-compose up --build
```

> Docker Compose config is included but targets PostgreSQL + Redis for production use. For local development, SQLite (no Docker needed) is recommended.

---

## 📊 Data & Privacy

- All data stored **locally** in a SQLite file (`fincopilot.db`)
- AI chat runs **100% locally** via Ollama — no data leaves your machine
- No telemetry, no analytics, no third-party data sharing

---

## 🛣️ Roadmap

- [ ] Mobile-responsive layout
- [ ] Dark mode
- [ ] Recurring expense detection & reminders
- [ ] Bank statement PDF import
- [ ] Multi-currency support
- [ ] Export to Excel / PDF report
- [ ] Push notifications for budget alerts

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ for personal finance in Pakistan</p>
