# Quantara Technical Architecture

**Last Updated: December 2024**

---

## Overview

Quantara is an AI-powered insurance broker intelligence platform. It unifies CRM, email, calendar, and broker management systems into one intelligent interface with real-time data access and AI-powered insights.

---

## Architecture Approach

### Connector-First Design
Quantara fetches data directly from source systems via OAuth 2.0 APIs. There is no RAG pipeline, no vector database, and no document embeddings. Every query triggers live API calls to connected services and returns results with full source attribution.

This means zero data duplication, real-time accuracy, and inherent compliance with data residency requirements.

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite | ✅ Complete |
| UI Components | shadcn/ui, Radix UI, Lucide Icons | ✅ Complete |
| Backend | Node.js, Express, TypeScript | ✅ Complete |
| ORM | Prisma | ✅ Complete |
| Database | PostgreSQL | ✅ Complete |
| AI | Google Gemini 2.0 Flash | ✅ Complete |
| Email | Brevo (Sendinblue) Transactional API | ✅ Complete |
| Hosting | Vercel (frontend), Railway (backend + DB) | ✅ Complete |

---

## Project Structure

```
quantara/
├── src/                          # Frontend (React)
│   ├── pages/
│   │   ├── Index.tsx             # Dashboard with renewals, stats, AI chat
│   │   ├── Clients.tsx           # Client management
│   │   ├── Policies.tsx          # Policy management
│   │   ├── Calendar.tsx          # Calendar view
│   │   ├── Reports.tsx           # Analytics & charts
│   │   ├── Settings.tsx          # User settings
│   │   ├── Integrations.tsx      # Connector management
│   │   └── RenewalDetail.tsx     # Renewal detail with tasks/quotes/docs
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── common/               # SourceIcon, Skeleton
│   │   ├── layout/               # AppLayout, Sidebar
│   │   ├── dialogs/              # AddClient, AddPolicy, EditPolicy
│   │   └── renewals/             # TaskList, QuoteComparison, DocumentUpload
│   ├── hooks/
│   │   ├── useRenewals.ts        # Renewal data fetching
│   │   ├── useClients.ts         # Client data fetching
│   │   ├── usePolicies.ts        # Policy data fetching
│   │   ├── useAIChat.ts          # AI chat integration
│   │   └── useTheme.ts           # Dark/light mode
│   ├── services/
│   │   └── api.ts                # API client with all endpoints
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication state
│   └── types/
│       └── broker.ts             # TypeScript definitions
│
├── server/                       # Backend (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts    # Login, register, logout
│   │   │   ├── renewal.routes.ts # Renewal CRUD
│   │   │   ├── client.routes.ts  # Client CRUD
│   │   │   ├── policy.routes.ts  # Policy CRUD
│   │   │   ├── ai.routes.ts      # AI chat, brief, email generation
│   │   │   ├── connector.routes.ts # OAuth connector management
│   │   │   ├── email.routes.ts   # Brevo email sending
│   │   │   ├── task.routes.ts    # Workflow task management
│   │   │   ├── document.routes.ts # Document upload/management
│   │   │   └── quote.routes.ts   # Quote comparison
│   │   ├── services/
│   │   │   ├── ai.service.ts     # Gemini AI integration
│   │   │   └── email.service.ts  # Brevo email service
│   │   ├── jobs/
│   │   │   └── renewal.job.ts    # Auto-renewal creation, task generation
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logging.middleware.ts
│   │   └── config/
│   │       └── index.ts          # Environment validation
│   └── prisma/
│       └── schema.prisma         # Database schema
│
├── docs/
│   ├── ROADMAP.md                # Feature roadmap & gap analysis
│   └── USER_COMPANY_FLOW.md      # Authentication & data flow docs
└── PRODUCT_DOCUMENTATION.md      # Full product specification
```

---

## Database Schema

### Core Models

| Model | Description | Status |
|-------|-------------|--------|
| User | Authentication, profile, company | ✅ Complete |
| Client | Insurance clients/accounts | ✅ Complete |
| Policy | Insurance policies with coverage details | ✅ Complete |
| Renewal | Renewal tracking with risk scoring | ✅ Complete |
| Quote | Quote comparison with detailed fields | ✅ Complete |
| Task | Workflow tasks per renewal | ✅ Complete |
| TaskTemplate | Default task templates | ✅ Complete |
| Document | Document storage with versioning | ✅ Complete |
| Activity | Activity logging | ✅ Complete |
| Connection | OAuth connector tokens | ✅ Complete |
| ChatSession | AI chat history | ✅ Complete |
| AuditLog | System audit trail | ✅ Complete |

### Key Relationships
```
User
├── Clients (1:many)
├── Policies (1:many)
├── Renewals (1:many)
└── Connections (1:many)

Renewal
├── Tasks (1:many)
├── Quotes (1:many)
├── Documents (1:many)
└── Activities (1:many)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Core Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/clients` | List/create clients |
| GET/PATCH/DELETE | `/api/clients/:id` | Client CRUD |
| GET/POST | `/api/policies` | List/create policies |
| GET/PATCH/DELETE | `/api/policies/:id` | Policy CRUD |
| GET/POST | `/api/renewals` | List/create renewals |
| GET | `/api/renewals/:id` | Get renewal details |

### Workflow & Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tasks` | List/create tasks |
| GET | `/api/tasks/renewal/:id` | Tasks for renewal with progress |
| PATCH | `/api/tasks/:id` | Update task status |
| POST | `/api/tasks/run-renewal-job` | Trigger auto-renewal creation |
| GET | `/api/tasks/escalations` | Get renewals needing attention |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/documents` | List/upload documents |
| GET | `/api/documents/renewal/:id` | Documents for renewal |
| DELETE | `/api/documents/:id` | Delete document |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/quotes` | List/create quotes |
| GET | `/api/quotes/renewal/:id` | Quotes for renewal with summary |
| POST | `/api/quotes/:id/select` | Select quote for binding |
| POST | `/api/quotes/compare` | Side-by-side comparison |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI chat with streaming |
| POST | `/api/ai/brief` | Generate client brief |
| POST | `/api/ai/email` | Generate email draft |
| GET | `/api/ai/status` | Check AI configuration |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send-renewal-reminder` | Send renewal reminder |
| POST | `/api/email/send-custom` | Send custom email |

### Connectors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connectors` | List all connectors |
| GET | `/api/connectors/:type/auth-url` | Get OAuth URL |
| POST | `/api/connectors/:type/connect` | Complete OAuth flow |
| DELETE | `/api/connectors/:type` | Disconnect |

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Gemini API key
- Brevo API key (for email)

### Frontend
```bash
npm install
npm run dev          # localhost:8080
```

### Backend
```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx prisma db seed   # Optional: seed demo data
npm run dev          # localhost:3001
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/quantara

# Authentication
JWT_SECRET=your-secret-key

# AI
GEMINI_API_KEY=your-gemini-key

# Email (Brevo)
BREVO_API_KEY=your-brevo-key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=Quantara

# OAuth Connectors (optional)
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

---

## Security

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT tokens with bcrypt password hashing |
| Rate Limiting | 100 req/15min general, 20/min AI endpoints |
| Headers | Helmet.js security headers |
| CORS | Whitelist configured origins |
| Data Isolation | All queries scoped by userId |
| Input Validation | Zod schemas on all endpoints |
| Audit Logging | All user actions logged |

---

## Production Deployment

| Service | URL |
|---------|-----|
| Frontend | quantara-three.vercel.app |
| Backend | backend-production-ceb3.up.railway.app |

---

## Feature Completion Status

### ✅ Complete
- User authentication (register, login, JWT)
- Client CRUD with search/filter
- Policy CRUD with status management
- Renewal tracking with risk scoring
- AI chat with Gemini integration
- AI brief generation
- AI email generation
- Email sending via Brevo
- Workflow task system with templates
- Document upload/management
- Quote comparison
- Dashboard with real API data
- Dark/light theme
- Responsive UI

### 🔄 Partial
- Connector OAuth (UI ready, needs production credentials)
- AI brief source citations (static, not real data)

### ❌ Not Started
- Role-based access control (RBAC)
- Multi-user company support
- Real-time notifications
- Mobile app
