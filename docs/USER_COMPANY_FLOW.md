# Quantara User & Company Flow Documentation

**Last Updated: December 2024**

## Overview

Quantara is a multi-tenant insurance broker platform where each **User** belongs to a **Company** and manages their own set of **Clients**, **Policies**, **Renewals**, **Tasks**, **Documents**, and **Quotes**. The system is designed for enterprise-grade security and data isolation.

---

## Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | JWT + bcrypt |
| Session Persistence | ✅ Complete | localStorage + refresh |
| Data Isolation | ✅ Complete | All queries scoped by userId |
| Client Management | ✅ Complete | Full CRUD |
| Policy Management | ✅ Complete | Full CRUD with status |
| Renewal Tracking | ✅ Complete | Auto-creation, risk scoring |
| Workflow Tasks | ✅ Complete | Task templates, progress tracking |
| Document Management | ✅ Complete | Upload, versioning |
| Quote Comparison | ✅ Complete | Side-by-side comparison |
| Email Sending | ✅ Complete | Brevo integration |
| AI Chat | ✅ Complete | Gemini integration |
| Connector OAuth | 🔄 Partial | UI ready, needs credentials |
| RBAC | ❌ Not Started | Future enterprise feature |
| Multi-User Company | ❌ Not Started | Future enterprise feature |

---

## 1. Authentication Flow

### 1.1 Registration Flow
```
User → Register Form → Backend API → Database → JWT Token → Authenticated Session
```

**Steps:**
1. User visits `/login` and clicks "Create Account"
2. User provides: Email, Password, Name, Company Name
3. Frontend calls `POST /api/auth/register`
4. Backend:
   - Validates input (Zod schema)
   - Checks for existing user
   - Hashes password (bcrypt, 12 rounds)
   - Creates User record in PostgreSQL
   - Generates JWT token
5. Frontend stores token in `localStorage` under `auth_token`
6. User redirected to Dashboard

### 1.2 Login Flow
```
User → Login Form → Backend API → Validate Credentials → JWT Token → Session
```

**Steps:**
1. User enters email and password
2. Frontend calls `POST /api/auth/login`
3. Backend:
   - Finds user by email
   - Compares password hash
   - Updates `lastLoginAt` timestamp
   - Generates JWT token
4. Token stored in `localStorage`
5. `AuthContext` updates with user data
6. User redirected to Dashboard

### 1.3 Session Persistence (Refresh)
```
Page Load → Check localStorage → Validate Token → Fetch User → Restore Session
```

**Implementation:**
```typescript
// AuthContext.tsx
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    api.setToken(token);
    refreshUser(); // Calls GET /api/auth/me
  }
}, []);
```

### 1.4 Logout Flow
```
User → Logout → Clear Token → Redirect to Login
```

**Steps:**
1. User clicks logout (avatar dropdown or settings)
2. `POST /api/auth/logout` called
3. Token removed from `localStorage`
4. `AuthContext` cleared
5. User redirected to `/login`

---

## 2. Data Ownership Model

### 2.1 Multi-Tenant Architecture
Every data record is scoped to a specific user:

```
User (id: "user_123")
├── Clients (userId: "user_123")
│   ├── Client A
│   └── Client B
├── Policies (userId: "user_123")
│   ├── Policy for Client A
│   └── Policy for Client B
├── Renewals (userId: "user_123")
│   ├── Renewal for Policy A
│   │   ├── Tasks (13 default tasks per renewal)
│   │   ├── Quotes (carrier quotes for comparison)
│   │   └── Documents (policy docs, loss runs, etc.)
│   └── Renewal for Policy B
└── Connections (OAuth tokens for integrations)
```

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
