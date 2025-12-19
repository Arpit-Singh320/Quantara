# Quantara User & Company Flow Documentation

**Version 2.0 | December 2024**

---

## Table of Contents

1. [Overview](#overview)
2. [User Journey Maps](#user-journey-maps)
3. [Authentication Flows](#authentication-flows)
4. [Data Ownership Model](#data-ownership-model)
5. [Core Workflows](#core-workflows)
6. [Integration Flows](#integration-flows)
7. [Security Implementation](#security-implementation)

---

## Overview

### What This Document Covers

This document explains how users interact with Quantara from a workflow perspective. It covers:

- How users register, login, and manage their sessions
- How data is isolated between users (multi-tenancy)
- Step-by-step workflows for each major feature
- Integration flows with external services (Google Calendar, Email)

### System Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION LAYER                             │
│                                                                             │
│  Browser → React Frontend → API Calls → Express Backend → PostgreSQL       │
│                                                                             │
│  Every request includes JWT token → Backend validates → Scopes to userId   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Feature Implementation Status

| Feature | Status | Implementation Details |
|---------|--------|----------------------|
| User Authentication | ✅ Complete | JWT + bcrypt, 24h token expiry |
| Session Persistence | ✅ Complete | localStorage token, auto-refresh |
| Data Isolation | ✅ Complete | All queries scoped by userId |
| Client Management | ✅ Complete | Full CRUD with search/filter |
| Policy Management | ✅ Complete | Full CRUD with status workflow |
| Renewal Tracking | ✅ Complete | Auto-creation, risk scoring |
| Workflow Tasks | ✅ Complete | 13 templates, progress tracking |
| Document Management | ✅ Complete | Upload, categorization, AI analysis |
| Quote Comparison | ✅ Complete | Side-by-side, selection, binding |
| Email Sending | ✅ Complete | Brevo integration, scheduling |
| AI Chat | ✅ Complete | Gemini 2.0 Flash, streaming |
| AI Briefs | ✅ Complete | Executive summaries, insights |
| Google Calendar | ✅ Complete | OAuth, events, Google Meet |
| Reports | ✅ Complete | Charts, analytics |

---

## User Journey Maps

### Journey 1: New User Onboarding

```
Day 1: Getting Started
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  1. REGISTER          2. EXPLORE           3. ADD DATA       4. USE AI    │
│  ───────────          ─────────            ──────────        ──────────   │
│  Create account       Tour dashboard       Add first client  Try AI chat  │
│  Set company name     View sample data     Add first policy  Generate brief│
│  Login                Check features       Initiate renewal  Send email   │
│                                                                            │
│  Time: 2 min          Time: 5 min          Time: 10 min      Time: 5 min  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Journey 2: Daily Workflow (Experienced User)

```
Morning Routine (15 minutes)
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  8:00 AM              8:05 AM              8:10 AM           8:15 AM       │
│  ────────             ────────             ────────          ────────      │
│  Open Dashboard       Review at-risk       Complete tasks    Send emails  │
│  Check priorities     Check calendar       Update quotes     Schedule calls│
│  Scan AI insights     Plan meetings        Upload docs                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Journey 3: Client Meeting Preparation

```
Before Meeting (5 minutes with Quantara vs 45 minutes without)
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  1. Find Renewal      2. Generate Brief    3. Review          4. Go!      │
│  ──────────────       ─────────────────    ───────────        ──────      │
│  Search client        Click "Brief"        Read summary       Meeting     │
│  Open renewal         Wait 3 seconds       Note key points    ready!      │
│  See all context      Brief generated      Check talking pts              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flows

### Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │   Frontend  │     │   Backend   │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  Fill form        │                   │                   │
       │  Click Register   │                   │                   │
       │──────────────────►│                   │                   │
       │                   │  POST /register   │                   │
       │                   │  {email, pass,    │                   │
       │                   │   name, company}  │                   │
       │                   │──────────────────►│                   │
       │                   │                   │                   │
       │                   │                   │  Validate input   │
       │                   │                   │  (Zod schema)     │
       │                   │                   │                   │
       │                   │                   │  Check existing   │
       │                   │                   │──────────────────►│
       │                   │                   │◄──────────────────│
       │                   │                   │                   │
       │                   │                   │  Hash password    │
       │                   │                   │  (bcrypt, 12)     │
       │                   │                   │                   │
       │                   │                   │  Create user      │
       │                   │                   │──────────────────►│
       │                   │                   │◄──────────────────│
       │                   │                   │                   │
       │                   │                   │  Generate JWT     │
       │                   │                   │  (24h expiry)     │
       │                   │                   │                   │
       │                   │  {token, user}    │                   │
       │                   │◄──────────────────│                   │
       │                   │                   │                   │
       │                   │  Store token      │                   │
       │                   │  localStorage     │                   │
       │                   │                   │                   │
       │  Redirect to      │                   │                   │
       │  Dashboard        │                   │                   │
       │◄──────────────────│                   │                   │
```

### Login Flow

```
User enters email + password
    ↓
Frontend validates (non-empty)
    ↓
POST /api/auth/login
    ↓
Backend finds user by email
    ↓
bcrypt.compare(password, hash)
    ↓
If match: Generate JWT, return token + user
    ↓
Frontend stores in localStorage
    ↓
AuthContext updates (isAuthenticated = true)
    ↓
Redirect to Dashboard
```

### Session Persistence

When the page loads or refreshes:

```typescript
// src/context/AuthContext.tsx
useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setToken(token);
      try {
        const response = await api.getCurrentUser();
        setUser(response.user);
        setIsAuthenticated(true);
      } catch {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  };
  initAuth();
}, []);
```

### Logout Flow

```
User clicks Logout
    ↓
POST /api/auth/logout (optional server-side)
    ↓
localStorage.removeItem('auth_token')
    ↓
AuthContext.setUser(null)
    ↓
Redirect to /login
```

---

## Data Ownership Model

### Multi-Tenant Architecture

Every piece of data in Quantara is owned by a specific user. This ensures complete data isolation between users—one broker cannot see another broker's clients, policies, or renewals.

```
User (id: "user_123")
│
├── Clients (userId: "user_123")
│   ├── TechFlow Industries
│   ├── Meridian Healthcare
│   └── Summit Manufacturing
│
├── Policies (userId: "user_123")
│   ├── TechFlow - Cyber Liability
│   ├── TechFlow - General Liability
│   ├── Meridian - D&O
│   └── Summit - Workers Comp
│
├── Renewals (userId: "user_123")
│   ├── TechFlow Cyber Renewal
│   │   ├── Tasks (13 workflow tasks)
│   │   ├── Quotes (Hartford, Liberty, Travelers)
│   │   ├── Documents (Loss run, Application)
│   │   └── Activities (Email sent, Quote received)
│   └── Meridian D&O Renewal
│       ├── Tasks
│       ├── Quotes
│       └── Documents
│
└── Connections (userId: "user_123")
    └── Google (OAuth tokens for calendar)
```

### How Data Isolation Works

Every API query includes the user's ID from their JWT token:

```typescript
// Example: GET /api/clients
router.get('/', authenticate, async (req, res) => {
  const userId = req.user?.id; // Extracted from JWT

  const clients = await prisma.client.findMany({
    where: { userId }, // CRITICAL: Only this user's data
    include: { policies: true }
  });

  res.json({ clients });
});
```

This pattern is applied to ALL data queries, ensuring users can never access data belonging to other users.

### 2.2 Database Schema (Current)
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  company      String?
  role         UserRole  @default(BROKER)

  clients      Client[]
  policies     Policy[]
  renewals     Renewal[]
  connections  Connection[]
  chatSessions ChatSession[]
  auditLogs    AuditLog[]
}

model Client {
  id        String   @id @default(cuid())
  userId    String
  name      String
  company   String
  email     String?
  phone     String?
  industry  String?

  policies  Policy[]
  renewals  Renewal[]
  documents Document[]
}

model Policy {
  id             String       @id @default(cuid())
  userId         String
  clientId       String
  policyNumber   String
  type           PolicyType
  carrier        String
  premium        Decimal
  coverageLimit  Decimal
  deductible     Decimal?
  effectiveDate  DateTime
  expirationDate DateTime
  status         PolicyStatus

  renewals       Renewal[]
  documents      Document[]
}

model Renewal {
  id            String        @id @default(cuid())
  userId        String
  clientId      String
  policyId      String
  dueDate       DateTime
  status        RenewalStatus
  riskScore     RiskLevel
  riskFactors   String[]
  aiSummary     String?
  aiInsights    String[]
  emailsSent    Int           @default(0)
  quotesReceived Int          @default(0)
  lastTouchedAt DateTime?

  tasks         Task[]
  quotes        Quote[]
  documents     Document[]
  activities    Activity[]
}

model Task {
  id          String     @id @default(cuid())
  renewalId   String
  name        String
  description String?
  dueDate     DateTime
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  category    TaskCategory
  order       Int        @default(0)
  completedAt DateTime?
}

model Quote {
  id            String      @id @default(cuid())
  renewalId     String
  carrier       String
  premium       Decimal
  coverageLimit Decimal
  deductible    Decimal?
  perOccurrence Decimal?
  aggregate     Decimal?
  coinsurance   Int?
  exclusions    String[]
  endorsements  String[]
  coverageScore Int?
  recommendation String?
  priceChange   Decimal?
  notes         String?
  status        QuoteStatus @default(PENDING)
  isSelected    Boolean     @default(false)
  receivedAt    DateTime    @default(now())
  expiresAt     DateTime?

  documents     Document[]
}

model Document {
  id           String       @id @default(cuid())
  name         String
  originalName String
  type         DocumentType
  mimeType     String
  size         Int
  storagePath  String?
  content      String?      // Base64 for now
  version      Int          @default(1)
  parentId     String?      // For versioning
  uploadedAt   DateTime     @default(now())

  clientId     String?
  policyId     String?
  renewalId    String?
  quoteId      String?
}
```

### 2.3 API Data Isolation
Every API route enforces user-scoped queries:

```typescript
// Example: GET /api/clients
router.get('/', authenticate, async (req, res) => {
  const userId = req.user?.id; // From JWT

  const clients = await prisma.client.findMany({
    where: { userId }, // Only this user's clients
    include: { policies: true }
  });

  res.json({ clients });
});
```

---

## 3. Renewal Workflow Flow

### 3.1 Auto-Renewal Creation
```
Scheduled Job → Find Expiring Policies → Create Renewals → Generate Tasks
```

**Trigger:** `POST /api/tasks/run-renewal-job`

**Process:**
1. Find policies expiring within 90 days
2. Check if active renewal already exists
3. Create renewal with calculated risk score
4. Generate 13 default workflow tasks from templates
5. Set task due dates relative to renewal date

### 3.2 Default Task Templates
| Task | Days Before Due | Category |
|------|-----------------|----------|
| Request updated exposures | -90 | DATA_COLLECTION |
| Request loss runs | -85 | DATA_COLLECTION |
| Review expiring policy | -80 | DATA_COLLECTION |
| Prepare submission | -75 | MARKETING |
| Send to markets | -70 | MARKETING |
| Follow up on quotes | -55 | QUOTE_FOLLOW_UP |
| Compare quotes received | -45 | QUOTE_FOLLOW_UP |
| Prepare proposal | -35 | PROPOSAL |
| Present to client | -30 | CLIENT_COMMUNICATION |
| Negotiate terms | -20 | CLIENT_COMMUNICATION |
| Bind coverage | -10 | BINDING |
| Issue certificates | -5 | POST_BIND |
| Deliver policy | 0 | POST_BIND |

### 3.3 Task Status Flow
```
PENDING → IN_PROGRESS → COMPLETED
                     ↘ OVERDUE (if past due date)
                     ↘ SKIPPED (manual skip)
```

### 3.4 Escalation Detection
```
GET /api/tasks/escalations
```

Returns renewals needing attention:
- No quotes received within 30 days of due date
- High risk with no activity in 7 days
- Overdue tasks

---

## 4. Quote Comparison Flow

### 4.1 Quote Lifecycle
```
Receive Quote → Enter Details → Compare → Select → Bind
```

### 4.2 Quote Entry
```
POST /api/quotes
{
  renewalId: "...",
  carrier: "Hartford",
  premium: 50000,
  coverageLimit: 1000000,
  deductible: 5000,
  perOccurrence: 1000000,
  aggregate: 2000000,
  exclusions: ["Cyber", "EPLI"],
  endorsements: ["Blanket AI"]
}
```

### 4.3 Quote Comparison
```
POST /api/quotes/compare
{ quoteIds: ["quote1", "quote2", "quote3"] }
```

Returns:
- Side-by-side coverage comparison
- Price change vs expiring premium
- Best value indicator
- Coverage score (if calculated)

### 4.4 Quote Selection
```
POST /api/quotes/:id/select
```
- Marks quote as selected
- Deselects other quotes for same renewal
- Logs activity

---

## 5. Document Management Flow

### 5.1 Document Types
| Type | Description |
|------|-------------|
| POLICY | Policy documents |
| QUOTE | Quote proposals |
| LOSS_RUN | Loss history reports |
| APPLICATION | Insurance applications |
| CERTIFICATE | Certificates of insurance |
| ENDORSEMENT | Policy endorsements |
| INVOICE | Premium invoices |
| CLAIM | Claim documents |
| CORRESPONDENCE | Email/letter copies |
| OTHER | Miscellaneous |

### 5.2 Upload Flow
```
Select File → Choose Type → Upload → Link to Entity
```

Documents can be linked to:
- Client
- Policy
- Renewal
- Quote

### 5.3 Versioning
Documents support versioning via `parentId` field. New versions reference the original document.

---

## 6. Email Flow

### 6.1 Renewal Reminder
```
POST /api/email/send-renewal-reminder
{ renewalId: "..." }
```

**Process:**
1. Fetch renewal with client and policy data
2. Generate email from template
3. Send via Brevo API
4. Log activity
5. Increment emailsSent counter

### 6.2 Custom Email
```
POST /api/email/send-custom
{
  to: "client@example.com",
  toName: "John Smith",
  subject: "Policy Renewal",
  body: "...",
  clientId: "..." // Optional, for logging
}
```

---

## 7. Connector/Integration Flow

### 7.1 OAuth 2.0 Flow (✅ Implemented)
```
User → Click "Connect" → Redirect to Provider → Authorize → Callback → Store Tokens
```

**Supported Connectors:**
| Connector | Status | Notes |
|-----------|--------|-------|
| Salesforce | 🔄 Ready | Needs production credentials |
| Microsoft 365 | 🔄 Ready | Needs production credentials |
| Google Workspace | 🔄 Ready | Needs production credentials |
| HubSpot | 🔄 Ready | Needs production credentials |

### 7.2 Connection Storage
OAuth tokens are stored encrypted in the `Connection` table with:
- Access token (encrypted)
- Refresh token (encrypted)
- Expiration timestamp
- Provider type

---

## 8. Frontend State Management

### 8.1 Auth Context (✅ Implemented)
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

### 8.2 Data Hooks (✅ Implemented)
| Hook | Purpose |
|------|---------|
| `useRenewals()` | Fetch renewals with filters |
| `useClients()` | Fetch clients |
| `usePolicies()` | Fetch policies |
| `useAIChat()` | AI chat with Gemini |
| `useTheme()` | Dark/light mode |

### 8.3 API Client (✅ Implemented)
All API calls go through `src/services/api.ts`:
- Automatic token injection
- Error handling
- Type-safe responses

---

## 9. Security Implementation

### 9.1 Authentication Security (✅ Implemented)
- **Password Hashing:** bcrypt with 12 salt rounds
- **JWT Tokens:** Signed with secret
- **Token Storage:** localStorage

### 9.2 API Security (✅ Implemented)
- **CORS:** Configured for frontend origin
- **Rate Limiting:** 100 req/15min general, 20/min AI
- **Input Validation:** Zod schemas
- **SQL Injection:** Prevented by Prisma ORM
- **Security Headers:** Helmet.js

### 9.3 Data Security (✅ Implemented)
- **Tenant Isolation:** All queries scoped by userId
- **Audit Logging:** AuditLog table for tracking

---

## 10. Testing the Flows

### 10.1 Auth Flow Test
1. Go to http://localhost:8080/login
2. Register new account or use demo credentials
3. Verify redirect to dashboard
4. Refresh page - should stay logged in
5. Click avatar → Settings → Logout

### 10.2 Renewal Workflow Test
1. Create a client
2. Create a policy with expiration in 60 days
3. Go to Policies → Click ⋮ → Initiate Renewal
4. Go to Dashboard → Click renewal card
5. View Tasks, Quotes, Documents tabs

### 10.3 Quote Comparison Test
1. Open a renewal detail page
2. Go to Quotes tab
3. Add 2-3 quotes from different carriers
4. View comparison table
5. Select a quote for binding

### 10.4 API Test (curl)
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@quantara.io","password":"demo123"}' | jq -r '.token')

# Get renewals
curl http://localhost:3001/api/renewals \
  -H "Authorization: Bearer $TOKEN"

# Get tasks for a renewal
curl http://localhost:3001/api/tasks/renewal/RENEWAL_ID \
  -H "Authorization: Bearer $TOKEN"

# Trigger renewal job
curl -X POST http://localhost:3001/api/tasks/run-renewal-job \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysAhead": 90}'
```

---

## 11. Production Checklist

### ✅ Completed
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] Rate limiting
- [x] Input validation (Zod)
- [x] CORS configuration
- [x] Security headers (Helmet)
- [x] Audit logging
- [x] Data isolation by userId

### 🔄 In Progress
- [ ] OAuth token encryption at rest
- [ ] Connector production credentials

### ❌ Future
- [ ] JWT expiration and refresh tokens
- [ ] httpOnly cookies for tokens
- [ ] Role-based access control
- [ ] Multi-user company support
- [ ] Real-time notifications
