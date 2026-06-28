# Restaurant SaaS Platform — MVP

A multi-tenant Restaurant SaaS platform built with **Next.js microservices**, **PostgreSQL + Sequelize**, **Redis**, and a **React frontend**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│              Vite · React Router · Zustand · TailwindCSS    │
└─────────────────────────┬───────────────────────────────────┘
                          │  HTTP
┌─────────────────────────▼───────────────────────────────────┐
│                    API Gateway  :3000                        │
│              Route Proxy · Auth Guard · Rate Limit          │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │          │
  :3001      :3002      :3003      :3004      :3005
┌──▼──┐  ┌───▼──┐  ┌────▼───┐  ┌───▼──┐  ┌───▼──────┐
│Auth │  │Order │  │Invntry │  │ POS  │  │Customer  │
│Svc  │  │ Svc  │  │  Svc   │  │ Svc  │  │  Svc     │
└──┬──┘  └───┬──┘  └────┬───┘  └───┬──┘  └───┬──────┘
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                         │
              ┌──────────┴──────────┐
              │     PostgreSQL       │
              │  (per-service DBs)  │
              └─────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   Redis (Pub/Sub +  │
              │   Cache + Sessions) │
              └─────────────────────┘
```

## Microservices

| Service         | Port | Database       | Responsibilities                          |
|-----------------|------|----------------|-------------------------------------------|
| API Gateway     | 3000 | —              | Routing, auth guard, rate limiting        |
| Auth Service    | 3001 | auth_db        | Login, onboarding, roles, JWT             |
| Order Service   | 3002 | order_db       | POS + online orders, order lifecycle      |
| Inventory Svc   | 3003 | inventory_db   | Ingredients, stock deduction, alerts      |
| POS Service     | 3004 | pos_db         | Billing, taxes, discounts                 |
| Customer Svc    | 3005 | customer_db    | Loyalty points, profiles, coupons         |

## Event-Driven Flow

```
Order Created
     ↓  (Redis Pub/Sub)
Inventory Updated (deduct ingredients per recipe)
     ↓  (Redis Pub/Sub)
Kitchen Dashboard Updated
     ↓  (Redis Pub/Sub)
Loyalty Points Added
```

## Tech Stack

### Backend
- **Next.js 14** (App Router — API Routes only per service)
- **Sequelize 6** + **PostgreSQL 15**
- **Redis** (ioredis) — Pub/Sub event bus + caching
- **JWT** — stateless auth
- **Zod** — runtime validation
- **bcryptjs** — password hashing

### Frontend
- **React 18** + **Vite**
- **React Router v6**
- **Zustand** — state management
- **React Query (TanStack Query)** — server state
- **Axios** — HTTP client (configurable base URL)
- **TailwindCSS** + **shadcn/ui** — UI components

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm 10+

### 1. Clone & Configure

```bash
git clone <repo-url>
cd restaurant-saas

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 2. Start Infrastructure (DB + Redis)

```bash
cd backend
docker-compose up -d postgres redis
```

### 3. Install & Migrate

```bash
# Install all workspace packages
cd backend && npm install

# Run migrations for each service
npm run migrate:auth
npm run migrate:order
npm run migrate:inventory
npm run migrate:pos
npm run migrate:customer

# Seed default data
npm run seed:auth
```

### 4. Start All Services

```bash
# In backend/
npm run dev
# Starts all services concurrently on their respective ports

# In a separate terminal, start frontend
cd frontend && npm install && npm run dev
```

### Or use Docker Compose (full stack)

```bash
docker-compose up --build
```

## Project Structure

```
restaurant-saas/
├── backend/
│   ├── package.json              # Monorepo workspaces root
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── shared/                   # @restaurant-saas/shared
│   │   ├── config/database.js
│   │   ├── middleware/
│   │   └── utils/
│   ├── gateway/                  # API Gateway :3000
│   └── services/
│       ├── auth-service/         # :3001
│       ├── order-service/        # :3002
│       ├── inventory-service/    # :3003
│       ├── pos-service/          # :3004
│       └── customer-service/     # :3005
└── frontend/
    ├── src/
    │   ├── config/api.config.js  # Configurable API endpoints
    │   ├── services/             # Per-service API clients
    │   ├── pages/                # Route pages
    │   ├── components/           # Reusable UI
    │   └── store/                # Zustand stores
    └── vite.config.js
```

## Multi-Tenant Architecture

Each restaurant has a `restaurant_id` (UUID) scoped to every resource. The auth service issues JWTs that include `restaurant_id` and `role`. All downstream services validate the token via the shared auth middleware and scope queries to the requesting restaurant.

Restaurant owners can configure their own:
- Menu items and pricing
- Tax rates
- Loyalty reward rules
- Online ordering settings

---

## Restaurant Settings (Multi-Vendor)

The frontend `Settings` page allows restaurant owners to manage:
- Restaurant profile (name, logo, address)
- Service toggles (POS, Online Ordering, Loyalty)
- Tax configuration
- Payment methods
- Staff and role management
