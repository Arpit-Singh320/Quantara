# Quantara Technical Architecture

**Last Updated: December 2024**
**Version: 2.0**

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Architecture](#database-architecture)
6. [API Reference](#api-reference)
7. [Authentication & Security](#authentication--security)
8. [AI Integration](#ai-integration)
9. [Google Calendar Integration](#google-calendar-integration)
10. [Email System](#email-system)
11. [Deployment Infrastructure](#deployment-infrastructure)
12. [Development Setup](#development-setup)

---

## Executive Overview

### What is Quantara?

Quantara is an AI-powered insurance broker intelligence platform designed to revolutionize how insurance professionals manage their daily operations. Think of it as a command center that brings together everything a broker needs—client information, policy details, renewal tracking, quote comparisons, and AI-powered insights—into one unified, intelligent interface.

### The Problem We Solve

Insurance brokers today face a fragmented workflow nightmare:

- **7+ disconnected systems** to check daily (CRM, email, calendar, broker management systems, quote platforms)
- **60-90 minutes per renewal** spent gathering context from multiple sources
- **Missed renewals** due to lack of centralized tracking
- **No intelligent prioritization** to focus on high-value, at-risk accounts
- **Manual email drafting** without access to full client context

### Our Solution

Quantara takes a **connector-first approach**—we integrate with the systems brokers already use (Salesforce, Google Workspace, Microsoft 365, Applied Epic) and layer AI intelligence on top. This means:

- **Real-time data access** without data duplication
- **AI-powered insights** that understand insurance terminology and workflows
- **Automated task management** with configurable templates
- **Smart document analysis** that extracts key information from policy documents
- **Meeting scheduling** with Google Calendar and Google Meet integration

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL INTEGRATIONS                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│  Salesforce │   Google    │  Microsoft  │   HubSpot   │   Brevo (Email)     │
│     CRM     │  Workspace  │    365      │     CRM     │                     │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────────┬──────────┘
       │             │             │             │                 │
       ▼             ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONNECTOR LAYER (OAuth 2.0)                          │
│  • Token management with automatic refresh                                   │
│  • User-scoped connections                                                   │
│  • Real-time API calls (no data storage)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API LAYER                                 │
│                         (Node.js + Express + TypeScript)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Auth     │  │   Business  │  │     AI      │  │   Email     │        │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Connector  │  │    Task     │  │  Document   │  │   Quote     │        │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  MIDDLEWARE: Auth • Rate Limiting • Error Handling • Logging • Validation  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (Prisma ORM)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Railway)                                               │
│  • 15+ tables with full relational integrity                                │
│  • User-scoped data isolation                                               │
│  • Audit logging for compliance                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI INTELLIGENCE ENGINE                                │
│                        (Google Gemini 2.0 Flash)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Natural language chat with streaming responses                           │
│  • Client brief generation with risk analysis                               │
│  • Email drafting with context awareness                                    │
│  • Document analysis and summarization                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

When a user interacts with Quantara, here's what happens:

1. **User Action** → Frontend sends request with JWT token
2. **Authentication** → Backend validates JWT, extracts user ID
3. **Authorization** → All database queries are scoped to user's data
4. **Business Logic** → Route handler processes the request
5. **Data Access** → Prisma ORM queries PostgreSQL
6. **AI Processing** → If needed, context is sent to Gemini API
7. **Response** → JSON response returned to frontend

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | Component-based UI framework |
| **TypeScript** | 5.x | Type safety and better developer experience |
| **Vite** | 5.x | Fast build tool and dev server |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Beautiful, accessible component library |
| **Radix UI** | Latest | Headless UI primitives for accessibility |
| **Lucide Icons** | Latest | Consistent, customizable icons |
| **Recharts** | 2.x | Data visualization for reports |
| **React Router** | 6.x | Client-side routing |
| **Sonner** | Latest | Toast notifications |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express.js** | 4.x | Web application framework |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 5.x | Modern ORM with type-safe queries |
| **PostgreSQL** | 17.x | Relational database |
| **JWT** | - | Stateless authentication |
| **bcrypt** | - | Password hashing |
| **Zod** | 3.x | Runtime schema validation |
| **Helmet** | - | Security headers |
| **CORS** | - | Cross-origin resource sharing |

### AI & External Services

| Service | Purpose |
|---------|---------|
| **Google Gemini 2.0 Flash** | AI chat, brief generation, email drafting |
| **Brevo (Sendinblue)** | Transactional email delivery |
| **Google Calendar API** | Calendar sync, event creation, Google Meet |
| **OAuth 2.0** | Secure third-party integrations |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting with global CDN |
| **Railway** | Backend hosting + PostgreSQL database |
| **GitHub** | Source control and CI/CD triggers |

---

## Project Structure

```
quantara/
│
├── src/                              # FRONTEND (React Application)
│   │
│   ├── pages/                        # Page Components
│   │   ├── Index.tsx                 # Dashboard - renewals, stats, AI chat
│   │   ├── Login.tsx                 # Authentication page
│   │   ├── Clients.tsx               # Client management with CRUD
│   │   ├── Policies.tsx              # Policy management with status tracking
│   │   ├── Calendar.tsx              # Calendar with Google integration
│   │   ├── Reports.tsx               # Analytics and charts
│   │   ├── Settings.tsx              # User preferences
│   │   ├── Integrations.tsx          # OAuth connector management
│   │   └── RenewalDetail.tsx         # Renewal workflow (tasks/quotes/docs)
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── layout/
│   │   │   └── AppLayout.tsx         # Main layout with sidebar
│   │   │
│   │   ├── dialogs/
│   │   │   ├── AddClientDialog.tsx   # Create new client
│   │   │   ├── AddPolicyDialog.tsx   # Create new policy
│   │   │   ├── EditPolicyDialog.tsx  # Edit existing policy
│   │   │   ├── AddEventDialog.tsx    # Calendar event with Google Meet
│   │   │   └── EmailDialog.tsx       # Email composition
│   │   │
│   │   └── renewals/
│   │       ├── TaskList.tsx          # Workflow task management
│   │       ├── QuoteComparison.tsx   # Side-by-side quote analysis
│   │       └── DocumentUpload.tsx    # Document management with AI analysis
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── useRenewals.ts            # Renewal data fetching and state
│   │   ├── useClients.ts             # Client data management
│   │   ├── usePolicies.ts            # Policy data management
│   │   ├── useAIChat.ts              # AI chat with streaming
│   │   ├── useConnectors.ts          # OAuth connection status
│   │   └── useTheme.ts               # Dark/light mode toggle
│   │
│   ├── services/
│   │   └── api.ts                    # Centralized API client (50+ methods)
│   │
│   ├── context/
│   │   └── AuthContext.tsx           # Global authentication state
│   │
│   └── types/
│       └── broker.ts                 # TypeScript type definitions
│
├── server/                           # BACKEND (Express Application)
│   │
│   ├── src/
│   │   ├── index.ts                  # Application entry point
│   │   ├── app.ts                    # Express app configuration
│   │   │
│   │   ├── routes/                   # API Route Handlers
│   │   │   ├── auth.routes.ts        # Authentication (login, register, logout)
│   │   │   ├── client.routes.ts      # Client CRUD operations
│   │   │   ├── policy.routes.ts      # Policy CRUD operations
│   │   │   ├── renewal.routes.ts     # Renewal tracking and management
│   │   │   ├── task.routes.ts        # Workflow task management
│   │   │   ├── quote.routes.ts       # Quote comparison
│   │   │   ├── document.routes.ts    # Document upload and analysis
│   │   │   ├── ai.routes.ts          # AI chat, brief, email generation
│   │   │   ├── email.routes.ts       # Email sending via Brevo
│   │   │   ├── connector.routes.ts   # OAuth and Google Calendar
│   │   │   └── calendar.routes.ts    # Calendar events
│   │   │
│   │   ├── services/
│   │   │   ├── ai.service.ts         # Gemini AI integration
│   │   │   └── email.service.ts      # Brevo email service
│   │   │
│   │   ├── connectors/               # OAuth Connector Implementations
│   │   │   ├── base.connector.ts     # Abstract base class
│   │   │   ├── google.connector.ts   # Google Workspace
│   │   │   ├── salesforce.connector.ts
│   │   │   ├── microsoft.connector.ts
│   │   │   └── hubspot.connector.ts
│   │   │
│   │   ├── jobs/
│   │   │   └── renewal.job.ts        # Auto-renewal creation from expiring policies
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT validation
│   │   │   ├── error.middleware.ts   # Global error handling
│   │   │   └── logging.middleware.ts # Request/response logging
│   │   │
│   │   └── config/
│   │       └── index.ts              # Environment variable validation
│   │
│   └── prisma/
│       ├── schema.prisma             # Database schema definition
│       └── seed.ts                   # Demo data seeding
│
├── docs/                             # Documentation
│   ├── ROADMAP.md
│   └── USER_COMPANY_FLOW.md
│
├── vercel.json                       # Vercel deployment config
├── ARCHITECTURE.md                   # This file
├── PRODUCT_DOCUMENTATION.md
└── PITCH_DECK.md
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌──────────────────┐
│      USER        │
├──────────────────┤
│ id (PK)          │
│ email            │
│ passwordHash     │
│ name             │
│ company          │
│ role             │
│ createdAt        │
│ lastLoginAt      │
└────────┬─────────┘
         │
         │ 1:many
         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│     CLIENT       │      │     POLICY       │      │   CONNECTION     │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│ id (PK)          │      │ id (PK)          │      │ id (PK)          │
│ userId (FK)      │◄────►│ userId (FK)      │      │ userId (FK)      │
│ name             │      │ clientId (FK)    │      │ provider         │
│ company          │      │ policyNumber     │      │ accessToken      │
│ email            │      │ type             │      │ refreshToken     │
│ phone            │      │ carrier          │      │ expiresAt        │
│ industry         │      │ premium          │      │ scope            │
│ address          │      │ coverageLimit    │      └──────────────────┘
│ createdAt        │      │ deductible       │
└────────┬─────────┘      │ effectiveDate    │
         │                │ expirationDate   │
         │                │ status           │
         │                └────────┬─────────┘
         │                         │
         │ 1:many                  │ 1:many
         ▼                         ▼
┌────────────────────────────────────────────┐
│                  RENEWAL                    │
├────────────────────────────────────────────┤
│ id (PK)                                    │
│ userId (FK)                                │
│ clientId (FK)                              │
│ policyId (FK)                              │
│ dueDate                                    │
│ status (PENDING/IN_PROGRESS/AT_RISK/...)   │
│ riskScore (LOW/MEDIUM/HIGH)                │
│ riskFactors []                             │
│ aiSummary                                  │
│ aiInsights []                              │
│ emailsSent                                 │
│ quotesReceived                             │
│ lastTouchedAt                              │
│ createdAt                                  │
└─────────────────┬──────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    │             │             │             │
    ▼             ▼             ▼             ▼
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│  TASK  │   │ QUOTE  │   │DOCUMENT│   │ACTIVITY│
└────────┘   └────────┘   └────────┘   └────────┘
```

### Core Models

#### User
The central entity representing a broker or admin using the platform.

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  passwordHash String
  name         String
  company      String?
  role         UserRole     @default(BROKER)
  createdAt    DateTime     @default(now())
  lastLoginAt  DateTime?

  // Relations
  clients      Client[]
  policies     Policy[]
  renewals     Renewal[]
  connections  Connection[]
  chatSessions ChatSession[]
  auditLogs    AuditLog[]
}
```

#### Client
Insurance clients managed by the broker.

```prisma
model Client {
  id        String   @id @default(cuid())
  userId    String   // Owner broker
  name      String   // Contact name
  company   String   // Company name
  email     String?
  phone     String?
  industry  String?  // e.g., "Manufacturing", "Healthcare"
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  policies  Policy[]
  renewals  Renewal[]
  documents Document[]
}
```

#### Policy
Insurance policies with full coverage details.

```prisma
model Policy {
  id             String       @id @default(cuid())
  userId         String
  clientId       String
  policyNumber   String
  type           PolicyType   // GENERAL_LIABILITY, CYBER, WORKERS_COMP, etc.
  carrier        String       // e.g., "Hartford", "Liberty Mutual"
  premium        Decimal
  coverageLimit  Decimal
  deductible     Decimal?
  effectiveDate  DateTime
  expirationDate DateTime
  status         PolicyStatus // ACTIVE, EXPIRED, CANCELLED, PENDING
  description    String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  renewals       Renewal[]
  documents      Document[]
}
```

#### Renewal
The heart of the system—tracks policy renewals with AI insights.

```prisma
model Renewal {
  id             String        @id @default(cuid())
  userId         String
  clientId       String
  policyId       String
  dueDate        DateTime
  status         RenewalStatus // PENDING, IN_PROGRESS, QUOTED, AT_RISK, SECURED, LOST
  riskScore      RiskLevel     // LOW, MEDIUM, HIGH
  riskFactors    String[]      // Array of risk descriptions
  aiSummary      String?       // AI-generated summary
  aiInsights     String[]      // AI recommendations
  emailsSent     Int           @default(0)
  quotesReceived Int           @default(0)
  lastTouchedAt  DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // Relations
  tasks          Task[]
  quotes         Quote[]
  documents      Document[]
  activities     Activity[]
}
```

#### Task
Workflow tasks with 13 default templates per renewal.

```prisma
model Task {
  id          String       @id @default(cuid())
  renewalId   String
  name        String
  description String?
  dueDate     DateTime
  status      TaskStatus   // PENDING, IN_PROGRESS, COMPLETED, OVERDUE, SKIPPED
  priority    Priority     // LOW, MEDIUM, HIGH, URGENT
  category    TaskCategory // DATA_COLLECTION, MARKETING, QUOTE_FOLLOW_UP, etc.
  order       Int          @default(0)
  completedAt DateTime?
  createdAt   DateTime     @default(now())
}
```

#### Quote
Carrier quotes for comparison.

```prisma
model Quote {
  id             String      @id @default(cuid())
  renewalId      String
  carrier        String
  premium        Decimal
  coverageLimit  Decimal
  deductible     Decimal?
  perOccurrence  Decimal?    // Per-occurrence limit
  aggregate      Decimal?    // Aggregate limit
  coinsurance    Int?        // Percentage
  exclusions     String[]    // What's not covered
  endorsements   String[]    // Additional coverages
  coverageScore  Int?        // AI-calculated score 0-100
  recommendation String?     // AI recommendation
  priceChange    Decimal?    // % change from expiring
  notes          String?
  status         QuoteStatus // PENDING, RECEIVED, SELECTED, DECLINED, EXPIRED
  isSelected     Boolean     @default(false)
  receivedAt     DateTime    @default(now())
  expiresAt      DateTime?

  // Relations
  documents      Document[]
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  BROKER
  VIEWER
}

enum PolicyType {
  GENERAL_LIABILITY
  PROFESSIONAL_LIABILITY
  CYBER
  PROPERTY
  WORKERS_COMP
  AUTO
  UMBRELLA
  DIRECTORS_OFFICERS
  EMPLOYMENT_PRACTICES
  OTHER
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
}

enum RenewalStatus {
  PENDING
  IN_PROGRESS
  QUOTED
  AT_RISK
  SECURED
  LOST
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  OVERDUE
  SKIPPED
}

enum TaskCategory {
  DATA_COLLECTION
  MARKETING
  QUOTE_FOLLOW_UP
  PROPOSAL
  CLIENT_COMMUNICATION
  BINDING
  POST_BIND
}

enum DocumentType {
  POLICY
  QUOTE
  LOSS_RUN
  APPLICATION
  CERTIFICATE
  ENDORSEMENT
  INVOICE
  CLAIM
  CORRESPONDENCE
  OTHER
}
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Create new user account | No |
| `POST` | `/api/auth/login` | Authenticate and get JWT | No |
| `POST` | `/api/auth/logout` | Invalidate session | Yes |
| `GET` | `/api/auth/me` | Get current user profile | Yes |

**Register Request:**
```json
{
  "email": "broker@example.com",
  "password": "securePassword123",
  "name": "John Smith",
  "company": "ABC Insurance Agency"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "broker@example.com",
    "name": "John Smith",
    "company": "ABC Insurance Agency",
    "role": "BROKER"
  }
}
```

### Client Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/clients` | List all clients with search/filter |
| `POST` | `/api/clients` | Create new client |
| `GET` | `/api/clients/:id` | Get client details |
| `PATCH` | `/api/clients/:id` | Update client |
| `DELETE` | `/api/clients/:id` | Delete client |

### Policy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/policies` | List all policies |
| `POST` | `/api/policies` | Create new policy |
| `GET` | `/api/policies/:id` | Get policy details |
| `PATCH` | `/api/policies/:id` | Update policy |
| `DELETE` | `/api/policies/:id` | Delete policy |
| `POST` | `/api/policies/:id/initiate-renewal` | Start renewal process |

### Renewal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/renewals` | List renewals with filters |
| `GET` | `/api/renewals/:id` | Get renewal with tasks/quotes/docs |
| `PATCH` | `/api/renewals/:id` | Update renewal status |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/renewal/:id` | Get tasks for renewal with progress |
| `POST` | `/api/tasks` | Create custom task |
| `PATCH` | `/api/tasks/:id` | Update task status |
| `POST` | `/api/tasks/run-renewal-job` | Trigger auto-renewal creation |
| `GET` | `/api/tasks/escalations` | Get at-risk renewals |

### Quote Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quotes/renewal/:id` | Get quotes for renewal |
| `POST` | `/api/quotes` | Add new quote |
| `POST` | `/api/quotes/:id/select` | Select quote for binding |
| `POST` | `/api/quotes/compare` | Get side-by-side comparison |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents/renewal/:id` | Get documents for renewal |
| `POST` | `/api/documents` | Upload document |
| `DELETE` | `/api/documents/:id` | Delete document |
| `POST` | `/api/ai/analyze-document` | AI document analysis |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | AI chat with streaming |
| `POST` | `/api/ai/brief` | Generate client brief |
| `POST` | `/api/ai/email` | Generate email draft |
| `GET` | `/api/ai/status` | Check AI configuration |

**Chat Request:**
```json
{
  "message": "What renewals need attention this week?",
  "context": {
    "renewalId": "optional-for-context"
  }
}
```

### Email Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/send-renewal-reminder` | Send renewal reminder |
| `POST` | `/api/email/send-custom` | Send custom email |
| `POST` | `/api/email/schedule` | Schedule email for later |

### Google Calendar Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/connectors/google/auth-url` | Get OAuth authorization URL |
| `GET` | `/api/connectors/google/callback` | OAuth callback handler |
| `GET` | `/api/connectors/google/calendar/events` | Fetch calendar events |
| `POST` | `/api/connectors/google/calendar/events` | Create event with optional Google Meet |

**Create Event with Google Meet:**
```json
{
  "title": "Renewal Review - TechFlow Industries",
  "description": "Discuss Q1 2025 renewal options",
  "start": "2025-01-15T14:00:00Z",
  "end": "2025-01-15T15:00:00Z",
  "attendees": ["client@techflow.com"],
  "addGoogleMeet": true
}
```

---

## Authentication & Security

### JWT Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  POST /login      │                   │
       │  {email, password}│                   │
       │──────────────────►│                   │
       │                   │  Find user        │
       │                   │──────────────────►│
       │                   │◄──────────────────│
       │                   │                   │
       │                   │  Verify password  │
       │                   │  (bcrypt.compare) │
       │                   │                   │
       │                   │  Generate JWT     │
       │  {token, user}    │  (24h expiry)     │
       │◄──────────────────│                   │
       │                   │                   │
       │  Store in         │                   │
       │  localStorage     │                   │
       │                   │                   │
       │  GET /api/renewals│                   │
       │  Authorization:   │                   │
       │  Bearer <token>   │                   │
       │──────────────────►│                   │
       │                   │  Verify JWT       │
       │                   │  Extract userId   │
       │                   │                   │
       │                   │  Query with       │
       │                   │  userId scope     │
       │                   │──────────────────►│
       │                   │◄──────────────────│
       │  {renewals}       │                   │
       │◄──────────────────│                   │
```

### Security Measures

| Layer | Implementation | Details |
|-------|----------------|---------|
| **Password Hashing** | bcrypt | 12 salt rounds |
| **Token Signing** | JWT HS256 | Secret from environment |
| **Rate Limiting** | express-rate-limit | 100 req/15min general, 20/min AI |
| **Security Headers** | Helmet.js | XSS, CSRF, clickjacking protection |
| **CORS** | Whitelist | Only configured origins |
| **Input Validation** | Zod | Runtime schema validation |
| **SQL Injection** | Prisma ORM | Parameterized queries |
| **Data Isolation** | User scoping | All queries include `userId` |

### Authentication Middleware

```typescript
// auth.middleware.ts
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return next(createError('User not found', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(createError('Invalid token', 401));
  }
};
```

---

## AI Integration

### Gemini 2.0 Flash Configuration

Quantara uses Google's Gemini 2.0 Flash model for all AI features. This model was chosen for:

- **Speed**: Sub-second response times for most queries
- **Cost**: More economical than GPT-4 for high-volume usage
- **Context**: 1M token context window for analyzing large documents
- **Streaming**: Native support for streaming responses

### AI Features

#### 1. AI Chat

Natural language interface for querying insurance data:

```typescript
// Example prompts and capabilities
"What renewals need attention this week?"
→ Lists high-risk renewals with reasons

"Show me all cyber liability policies expiring in Q1"
→ Filtered policy list with details

"Draft an email to remind Sarah about her renewal"
→ Personalized email with context from CRM
```

#### 2. Client Brief Generation

One-page summaries for meeting preparation:

```typescript
POST /api/ai/brief
{
  "clientId": "...",
  "clientName": "TechFlow Industries",
  "industry": "Technology",
  "policyType": "CYBER",
  "premium": 250000,
  "daysUntilRenewal": 15,
  "riskFactors": ["No response to emails", "Competitor quote received"]
}

Response:
{
  "summary": "TechFlow is a high-value client at elevated risk...",
  "insights": [
    "Recommend matching competitor pricing",
    "Highlight claims-free discount eligibility"
  ],
  "riskFactors": [
    "No response to 3 renewal emails",
    "CFO met with Liberty Mutual last week"
  ]
}
```

#### 3. Email Drafting

Context-aware email generation:

```typescript
POST /api/ai/email
{
  "clientName": "Sarah Chen",
  "policyType": "General Liability",
  "purpose": "renewal_reminder",
  "tone": "friendly"
}

Response:
{
  "email": {
    "subject": "Quick Check-in: Your GL Policy Renewal",
    "body": "Hi Sarah,\n\nI hope this finds you well..."
  }
}
```

#### 4. Document Analysis

Extract key information from uploaded documents:

```typescript
POST /api/ai/analyze-document
{
  "documentName": "TechFlow_LossRun_2024.pdf",
  "documentType": "LOSS_RUN",
  "content": "base64-encoded-content"
}

Response:
{
  "overview": "Loss run showing 3 claims over past 5 years...",
  "keyInformation": {
    "totalClaims": 3,
    "totalPaid": 125000,
    "largestClaim": 75000
  },
  "riskFactors": [
    { "level": "medium", "description": "Increasing claim frequency" }
  ],
  "summaryPoints": [
    "Claims-free for past 18 months",
    "Prior water damage claim fully resolved"
  ]
}
```

---

## Google Calendar Integration

### OAuth 2.0 Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │   Google    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  Click "Connect   │                   │
       │  Google"          │                   │
       │                   │                   │
       │  GET /auth-url    │                   │
       │──────────────────►│                   │
       │                   │                   │
       │  {authUrl}        │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │  Redirect to      │                   │
       │  Google OAuth     │                   │
       │───────────────────────────────────────►
       │                   │                   │
       │                   │  User authorizes  │
       │                   │                   │
       │                   │  GET /callback    │
       │                   │  ?code=xxx        │
       │                   │◄──────────────────│
       │                   │                   │
       │                   │  Exchange code    │
       │                   │  for tokens       │
       │                   │──────────────────►│
       │                   │◄──────────────────│
       │                   │                   │
       │                   │  Store tokens     │
       │                   │  (in memory)      │
       │                   │                   │
       │  Redirect to      │                   │
       │  /calendar        │                   │
       │◄──────────────────│                   │
```

### Features

| Feature | Description |
|---------|-------------|
| **Event Sync** | Fetch events from Google Calendar |
| **Create Events** | Create calendar events from Quantara |
| **Google Meet** | Auto-generate Meet links for new events |
| **Attendees** | View attendee list and response status |
| **Two-way Display** | Google events shown alongside local events |

### Scopes Requested

```
openid
email
profile
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

---

## Email System

### Brevo Integration

Quantara uses Brevo (formerly Sendinblue) for transactional email delivery.

**Configuration:**
```env
BREVO_API_KEY=your-api-key
SENDER_EMAIL=renewals@yourcompany.com
SENDER_NAME=Quantara Renewals
```

**Email Types:**

| Type | Trigger | Template |
|------|---------|----------|
| Renewal Reminder | Manual or scheduled | Client name, policy type, due date |
| Custom Email | User-composed | Freeform with AI assistance |
| Scheduled Email | Time-based | Queued for future delivery |

---

## Deployment Infrastructure

### Production URLs

| Service | URL | Provider |
|---------|-----|----------|
| Frontend | `quantara-three.vercel.app` | Vercel |
| Backend API | `backend-production-ceb3.up.railway.app` | Railway |
| Database | Railway PostgreSQL | Railway |
| API Health | `backend-production-ceb3.up.railway.app/health` | - |
| API Docs | `backend-production-ceb3.up.railway.app/docs` | - |

### Vercel Configuration (Frontend)

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### Railway Configuration (Backend)

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Health Check**: `GET /health`
- **Auto-deploy**: On push to `main` branch

---

## Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20.x)
- PostgreSQL 14+ (or use Railway)
- Google Cloud Console project (for OAuth)
- Gemini API key
- Brevo account (for email)

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/Arpit-Singh320/Quantara.git
cd Quantara

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API URL
# VITE_API_URL=http://localhost:3001

# Start development server
npm run dev
# → Running on http://localhost:8080
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials:
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret
# GEMINI_API_KEY=your-key
# BREVO_API_KEY=your-key
# GOOGLE_CLIENT_ID=your-id
# GOOGLE_CLIENT_SECRET=your-secret

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed demo data
npx prisma db seed

# Start development server
npm run dev
# → Running on http://localhost:3001
```

### Environment Variables

```env
# === DATABASE ===
DATABASE_URL=postgresql://user:pass@host:5432/quantara

# === AUTHENTICATION ===
JWT_SECRET=your-super-secret-key-at-least-32-characters

# === AI ===
GEMINI_API_KEY=your-gemini-api-key

# === EMAIL ===
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=Quantara

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# === SERVER ===
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:8080
```

---

## Feature Completion Status

### ✅ Fully Implemented

- User authentication (register, login, JWT, session persistence)
- Client management (CRUD, search, filtering)
- Policy management (CRUD, status tracking, expiration alerts)
- Renewal tracking (auto-creation, risk scoring, status workflow)
- Task management (13 templates, progress tracking, escalations)
- Quote comparison (side-by-side, AI scoring, selection)
- Document management (upload, categorization, AI analysis)
- AI chat (streaming responses, context awareness)
- AI brief generation (executive summary, risk factors, insights)
- AI email drafting (tone selection, personalization)
- Email sending (Brevo integration, scheduling)
- Google Calendar integration (OAuth, event sync, Google Meet)
- Dashboard (real-time data, statistics, renewal pipeline)
- Reports (charts, analytics)
- Dark/light theme
- Responsive design

### 🔄 Partial Implementation

- Other OAuth connectors (Salesforce, Microsoft, HubSpot) - UI ready, needs production credentials

### ❌ Not Yet Implemented

- Role-based access control (RBAC)
- Multi-user company support
- Real-time notifications (WebSocket)
- Mobile application
- PDF export for briefs
- Advanced ML risk prediction

---

*Document Version 2.0 | December 2024 | Quantara Team*
