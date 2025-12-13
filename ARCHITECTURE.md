# Quantara Technical Architecture

**Dec 2025**

---

## Connector-First Approach

Quantara fetches data directly from source systems via OAuth 2.0 APIs. There is no RAG pipeline, no vector database, and no document embeddings. Every query triggers live API calls to connected services (Salesforce, Microsoft 365, Google, HubSpot, etc.) and returns results with full source attribution.

This means zero data duplication, real-time accuracy, and inherent compliance with data residency requirements.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |
| AI | Gemini 2.0 Flash |
| Hosting | Vercel (frontend), Railway (backend + database) |

---

## Project Structure

```
quantara/
├── src/                    # Frontend
│   ├── pages/              # Dashboard, Clients, Policies, Calendar, Reports
│   ├── components/         # UI components (shadcn/ui)
│   ├── hooks/              # useAIChat, useTheme
│   ├── services/           # API client
│   └── types/              # TypeScript definitions
│
├── server/                 # Backend
│   ├── src/
│   │   ├── routes/         # auth, renewals, clients, policies, ai, connectors
│   │   ├── middleware/     # auth, rate limiting, error handling
│   │   └── config/         # Environment validation
│   └── prisma/
│       └── schema.prisma   # Database schema
```

---

## Setup

### Frontend
```bash
npm install
npm run dev          # localhost:8080
```

### Backend
```bash
cd server
npm install
cp .env.example .env # Configure DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npx prisma generate
npx prisma db push
npm run dev          # localhost:3001
```

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Signing key for JWT tokens
- `GEMINI_API_KEY` — Google Gemini API key

---

## Security

- JWT authentication with bcrypt password hashing
- Rate limiting (100 requests/15min general, 20/min for AI endpoints)
- Helmet.js security headers
- CORS whitelist
- Audit logging for all user actions
- Zero document storage — data stays in source systems

---

## API Overview

**Auth:** `/api/auth/login`, `/api/auth/register`, `/api/auth/me`

**Data:** `/api/renewals`, `/api/clients`, `/api/policies`

**AI:** `/api/ai/chat`, `/api/ai/brief`, `/api/ai/email`

**Connectors:** `/api/connectors`, `/api/connectors/:type/connect`

---

## Production

| Service | URL |
|---------|-----|
| Frontend | quantara-three.vercel.app |
| Backend | backend-production-ceb3.up.railway.app |

---

## Database

Core tables: `users`, `connections`, `clients`, `policies`, `renewals`, `quotes`, `activities`, `chat_sessions`, `audit_logs`

All OAuth tokens are encrypted. No customer documents are stored.
