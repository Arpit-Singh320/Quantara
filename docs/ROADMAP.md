# Quantara Production Roadmap

## Reality Check: Where We Are vs. Where We Need To Be

This document outlines the gaps between the current demo state and a production-ready insurance broker intelligence platform suitable for Marsh McLennan or similar enterprise clients.

---

## Current State Assessment

### ✅ What Works Today

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | JWT + bcrypt, session persistence |
| Client CRUD | ✅ Complete | Create, Read, Update, Delete |
| Policy CRUD | ✅ Complete | With status management |
| Renewal Creation | ✅ Complete | From policy action |
| Calendar Events | ✅ Complete | Add/view events |
| AI Chat | ✅ Complete | Connected to Google Gemini |
| AI Brief Generation | ✅ Partial | Static template, not real data |
| Dark/Light Mode | ✅ Complete | Theme persistence |
| Responsive UI | ✅ Complete | Mobile-friendly |

### ✅ Recently Fixed (December 2024)

| Issue | Status | Notes |
|-------|--------|-------|
| **Dashboard shows mock data** | ✅ Fixed | Now fetches from `/api/renewals` |
| **Renewals not auto-created** | ✅ Fixed | Auto-renewal job for expiring policies |
| **8 renewals count is hardcoded** | ✅ Fixed | Dynamic stats from API |
| **No email sending** | ✅ Fixed | Brevo integration complete |
| **No workflow/tasks** | ✅ Fixed | Full task/checklist system |
| **No document management** | ✅ Fixed | Upload/storage API ready |
| **No quote comparison** | ✅ Fixed | Side-by-side comparison API |

### ⚠️ Still Needs Work

| Issue | Impact | Priority |
|-------|--------|----------|
| **Brief uses fake sources** | No real traceability | 🟠 High |
| **UI components for tasks** | Backend ready, needs UI | 🟠 High |
| **UI for quote comparison** | Backend ready, needs UI | 🟠 High |

### ❌ Not Implemented

| Feature | Why It Matters |
|---------|----------------|
| Real connector OAuth | Needs production credentials |
| Role-based access | Enterprise requirement |
| Audit logging | Compliance requirement |

---

## How Insurance Broking Actually Works

### The Renewal Timeline (Commercial Lines)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RENEWAL TIMELINE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  90-180 DAYS BEFORE EXPIRY                                              │
│  ├── Renewal kickoff: set timeline, assign owners                       │
│  ├── Collect updated exposures (revenue, payroll, locations, etc.)     │
│  ├── Request loss runs / claims history from carriers                   │
│  └── Check compliance needs (certificates, additional insureds)         │
│                                                                          │
│  45-90 DAYS BEFORE EXPIRY                                               │
│  ├── Market the account: send submissions to carriers                   │
│  ├── Underwriter Q&A: clarifications, missing docs                      │
│  └── Quotes arrive in various formats                                   │
│                                                                          │
│  15-45 DAYS BEFORE EXPIRY                                               │
│  ├── Compare quotes: coverages, limits, exclusions, deductibles        │
│  ├── Present proposal to client with recommendations                    │
│  ├── Negotiate terms and pricing                                        │
│  └── Bind coverage: get approval, issue binders                         │
│                                                                          │
│  AFTER BINDING                                                           │
│  ├── Policy issuance                                                    │
│  ├── Certificates of Insurance (COIs)                                   │
│  ├── Endorsements (midterm changes)                                     │
│  └── Claims support, next renewal planning                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### What Brokers Actually Need

1. **Workflow Engine** - Tasks, checklists, due dates, escalation
2. **Document Management** - PDFs (quotes, policies, loss runs, COIs)
3. **Multi-Contact Clients** - Not just one contact per account
4. **Deep Policy Data** - Limits, deductibles, exclusions, endorsements
5. **Quote Comparison** - Side-by-side coverage analysis
6. **Real Email Integration** - Send/receive, log to account
7. **Calendar Integration** - Schedule meetings, set reminders

---

## Gap Analysis

### Gap 1: Dashboard Shows Mock Data (CRITICAL)

**Current State:**
- Dashboard hardcodes 6 mock renewals
- Stats cards show fake numbers
- New clients/policies don't appear

**What's Needed:**
- Dashboard must fetch from `/api/renewals` API
- Stats must aggregate from `/api/dashboard/stats`
- Auto-create renewals when policies approach expiration

### Gap 2: No Workflow/Task Engine

**Current State:**
- No tasks or checklists
- No due dates or owners
- No escalation triggers

**What's Needed:**
```
RenewalWorkflow {
  id, renewalId, status
  tasks: [
    { name: "Request exposures", dueDate, owner, status }
    { name: "Request loss runs", dueDate, owner, status }
    { name: "Send submissions", dueDate, owner, status }
    { name: "Follow up quotes", dueDate, owner, status }
    { name: "Prepare proposal", dueDate, owner, status }
    { name: "Bind coverage", dueDate, owner, status }
  ]
  escalations: [
    { trigger: "renewal < 30 days && no quotes", action: "notify manager" }
  ]
}
```

### Gap 3: Data Model Too Shallow

**Current State:**
- Policy has: premium, coverageLimit (single values)
- No structured limits per coverage
- No deductibles, exclusions, endorsements

**What's Needed:**
```prisma
model Policy {
  // Current fields...

  // Add structured coverage
  coverages      Coverage[]
  endorsements   Endorsement[]
  exclusions     String[]
  forms          String[]

  // Add schedules
  locations      Location[]
  vehicles       Vehicle[]
  payrollClasses PayrollClass[]
}

model Coverage {
  id           String
  policyId     String
  type         String    // "General Liability", "Property", etc.
  limit        Decimal
  deductible   Decimal
  coinsurance  Int?
  perOccurrence Decimal?
  aggregate    Decimal?
}
```

### Gap 4: No Document Management

**Current State:**
- No file uploads
- No document storage
- No PDF extraction

**What's Needed:**
- Document upload to S3/CloudFlare R2
- Link documents to clients/policies/renewals
- Basic OCR for quote extraction
- Version control and audit trail

### Gap 5: No Real Email Sending

**Current State:**
- "Send Email" generates text but doesn't send
- No email logging to accounts

**What's Needed:**
- Brevo (Sendinblue) integration for transactional emails
- Email templates with variable substitution
- Activity logging when email sent
- Track opens/clicks (optional)

### Gap 6: AI Briefs Use Fake Sources

**Current State:**
- "Data Sources" are generic placeholders
- No real traceability to actual records

**What's Needed:**
- Pull real emails from connected Microsoft/Google
- Pull real policy data from database
- Pull real activity log entries
- Each insight links to source record ID

---

## Production Roadmap

### Phase 1: Fix Core Issues (Week 1)

| Task | Priority | Effort |
|------|----------|--------|
| Dashboard fetches real API data | 🔴 Critical | 4 hours |
| Auto-create renewals for expiring policies | 🔴 Critical | 4 hours |
| Fix stats to show real counts | 🔴 Critical | 2 hours |
| Add missing client/policy form fields | 🟠 High | 3 hours |
| Integrate Brevo for email sending | 🟠 High | 4 hours |

### Phase 2: Workflow Engine (Week 2)

| Task | Priority | Effort |
|------|----------|--------|
| Create Task model in database | 🟠 High | 2 hours |
| Build task list UI component | 🟠 High | 4 hours |
| Create checklist templates per policy type | 🟠 High | 3 hours |
| Add task assignment to renewals | 🟠 High | 3 hours |
| Build escalation triggers | 🟡 Medium | 4 hours |

### Phase 3: Deep Insurance Data (Week 3)

| Task | Priority | Effort |
|------|----------|--------|
| Extend Policy model with coverages | 🟠 High | 4 hours |
| Build coverage detail forms | 🟠 High | 6 hours |
| Add quote comparison view | 🟠 High | 6 hours |
| Add document upload to policies | 🟡 Medium | 4 hours |

### Phase 4: Real AI Features (Week 4)

| Task | Priority | Effort |
|------|----------|--------|
| Brief pulls real data sources | 🟠 High | 6 hours |
| Source citations link to records | 🟠 High | 4 hours |
| Risk scoring based on real signals | 🟡 Medium | 6 hours |
| Email generation with real context | 🟡 Medium | 4 hours |

### Phase 5: Enterprise Features (Week 5+)

| Task | Priority | Effort |
|------|----------|--------|
| Role-based access control | 🟡 Medium | 6 hours |
| Audit logging | 🟡 Medium | 4 hours |
| Real connector OAuth flows | 🟡 Medium | 8 hours |
| Multi-user collaboration | 🟡 Medium | 6 hours |

---

## Technical Implementation Details

### Brevo Email Integration

```typescript
// server/src/services/email.service.ts
import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export async function sendEmail(options: {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  templateId?: number;
  params?: Record<string, string>;
}) {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: options.to, name: options.toName }];
  sendSmtpEmail.sender = { email: 'broker@quantara.io', name: 'Quantara' };
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.htmlContent;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
}
```

### Auto-Create Renewals Job

```typescript
// server/src/jobs/renewal.job.ts
export async function createRenewalsForExpiringPolicies() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 90);

  // Find policies expiring in next 90 days without renewals
  const policies = await prisma.policy.findMany({
    where: {
      expirationDate: { lte: thirtyDaysFromNow },
      status: 'ACTIVE',
      renewals: { none: { status: { in: ['PENDING', 'IN_PROGRESS', 'QUOTED'] } } }
    }
  });

  for (const policy of policies) {
    await prisma.renewal.create({
      data: {
        userId: policy.userId,
        clientId: policy.clientId,
        policyId: policy.id,
        dueDate: policy.expirationDate,
        status: 'PENDING',
        riskScore: calculateRiskScore(policy),
        riskFactors: generateRiskFactors(policy),
      }
    });
  }
}
```

### Task/Workflow Model

```prisma
model Task {
  id          String     @id @default(cuid())
  renewalId   String
  renewal     Renewal    @relation(fields: [renewalId], references: [id])

  name        String
  description String?
  dueDate     DateTime
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)

  assignedToId String?
  assignedTo   User?     @relation(fields: [assignedToId], references: [id])

  completedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  OVERDUE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## Success Metrics

### Before (Current State)

- Time per renewal: Manual, unknown
- Data accuracy: Mock data only
- Source traceability: 0%
- Workflow automation: None

### Target State

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time per renewal prep | < 30 minutes | User surveys |
| Data accuracy | 100% from API | Automated |
| Source traceability | 100% | Audit logs |
| Missed renewal alerts | 0 | System alerts |
| User adoption | 80%+ daily active | Analytics |

---

## Hackathon Demo Script (2-3 Minutes)

### Scene: Renewal Due in 14 Days, Client Unresponsive

**Narrator:** "Meet Sarah, a commercial insurance broker at Marsh. She has 47 renewals due this quarter."

**Demo Flow:**

1. **Dashboard** (0:30)
   - Show real renewal list from database
   - Highlight high-risk renewal (red badge)
   - "Coastal Hospitality - 3 days left, no response"

2. **AI Brief** (0:45)
   - Click "Brief" button
   - Show auto-generated summary with **real citations**
   - "Based on 7 emails and payment history..."
   - Click source → shows actual email snippet

3. **Workflow Tasks** (0:30)
   - Show checklist: "Request exposures ✓, Loss runs ✓, Quotes ⚠️ overdue"
   - Auto-escalation: "Notified manager due to 3-day deadline"

4. **AI Email** (0:30)
   - Click "Send Email"
   - AI generates contextual follow-up
   - Click "Send via Brevo" → email actually sends
   - Activity logged to timeline

5. **Outcome** (0:15)
   - "Sarah saved 45 minutes on this renewal"
   - "Zero missed deadlines with auto-escalation"

---

## Environment Variables Needed

```env
# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key

# AI (already configured)
GEMINI_API_KEY=your_gemini_key

# OAuth Connectors (for production)
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Next Immediate Actions

1. **NOW**: Fix Dashboard to fetch real renewals from API
2. **NOW**: Create renewals for the new policy (POL-2025-9120)
3. **TODAY**: Add Brevo email integration
4. **THIS WEEK**: Build task/workflow system

---

*Document Version: 1.0 | Created: December 17, 2024*
