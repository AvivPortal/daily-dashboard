# Daily Dashboard

Personal productivity dashboard — portfolio project.

## Tech Stack

| | Tech |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, dnd-kit |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh tokens) + bcrypt |

## Features

- **Dashboard** — KPI overview: expenses, tasks, jobs, habits
- **Budget** — Track expenses by category with monthly bar chart and category pie chart
- **Tasks** — Kanban board (TODO / In Progress / Done) with drag-and-drop
- **Job Applications** — Track job pipeline status (Applied → Interview → Offer)
- **Habits & Goals** — Daily habit checklist with streak counter + progress goals
- **Notes** — Masonry note grid with pin, tags, search and color coding

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd DailyDashboard

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp .env.example server/.env
# Edit server/.env with your PostgreSQL credentials

# 4. Run database migrations
cd server
npx prisma migrate dev --name init
npm run db:seed

# 5. Start development
cd ..
npm run dev
```

App runs at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Demo credentials: `demo@dashboard.com` / `password123`

## Project Structure

```
DailyDashboard/
├── client/          # React + TypeScript frontend (Vite)
│   └── src/
│       ├── components/   # Shared UI + Layout
│       ├── pages/        # Dashboard, Budget, Tasks, Jobs, Habits, Notes
│       ├── services/     # Axios API calls
│       ├── context/      # AuthContext
│       ├── types/        # TypeScript interfaces
│       └── utils/        # Formatting helpers
└── server/          # Express + TypeScript backend (MVC)
    └── src/
        ├── controllers/  # Request handlers
        ├── routes/       # Express routers
        ├── middleware/   # Auth + Error handling
        ├── services/     # Business logic
        └── utils/        # JWT, Prisma client, ApiError
```

## Architecture

**MVC Pattern:**
- **Model** — Prisma schema (`server/prisma/schema.prisma`)
- **View** — React components (`client/src/pages/`)
- **Controller** — Express controllers (`server/src/controllers/`)

**Auth Flow:** JWT access token (15min) + refresh token (7d) stored in localStorage. Axios interceptor auto-refreshes on 401.
