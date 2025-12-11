# Quantara - Product Documentation

## AI-Powered Insurance Intelligence Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State - What We Have](#current-state---what-we-have)
3. [Architecture Overview](#architecture-overview)
4. [Feature Deep Dive](#feature-deep-dive)
5. [Roadmap to Production](#roadmap-to-production)
6. [Technical Implementation Plan](#technical-implementation-plan)
7. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem

Insurance brokers spend **60-90 minutes per renewal** jumping between disconnected systems:
- CRM (Salesforce, HubSpot)
- Email (Outlook, Gmail)
- Calendar applications
- Broker management systems (Applied, AMS360)
- Quote systems

This fragmentation leads to:
- ❌ Missed renewal deadlines
- ❌ Manual context-gathering
- ❌ Unstructured email communication
- ❌ No intelligent prioritization
- ❌ Lost revenue and client dissatisfaction

### The Solution: Quantara

A **connector-first AI-powered assistant** that:
- ✅ Unifies all systems with real-time data access
- ✅ Auto-generates intelligent renewal pipelines
- ✅ Creates context-rich client briefs
- ✅ Predicts client behavior and churn risk
- ✅ Provides AI meeting prep and outreach support
- ✅ Answers questions from live data with 100% source traceability

### Target Metrics

| Metric | Target |
|--------|--------|
| AI Answer Accuracy | 90%+ |
| Source Traceability | 100% |
| Document Storage | 0% (Zero-storage architecture) |
| Time Savings | 50%+ |
| Integration Coverage | 80%+ |

---

## Current State - What We Have

### ✅ Completed Features (MVP)

#### 1. Dashboard & Renewal Pipeline
**Location:** `src/pages/Index.tsx`

- **Renewal Cards** with risk indicators (high/medium/low)
- **Days until renewal** countdown
- **Client information** display (name, company, policy type)
- **Premium amounts** and coverage limits
- **Status tracking** (pending, in_progress, at_risk, secured)
- **Quick actions** (view brief, send email, schedule call)

#### 2. AI Chat Interface
**Location:** `src/pages/Index.tsx` (ChatInterface component)

- **Natural language Q&A** about renewals and clients
- **Streaming responses** with typewriter effect
- **Source citations** with clickable references
- **Suggested questions** for quick access
- **Conversation history** persistence

#### 3. AI-Powered Client Briefs
**Location:** `src/pages/Index.tsx` (BriefModal component)

- **One-page summary** of client situation
- **Risk factors** with severity indicators
- **AI insights** and recommendations
- **Source attribution** for every data point
- **Meeting agenda** with AI-suggested topics
- **Talking points** categorized by type (risk/opportunity/info)

#### 4. Multi-Source Data Integration (Mock)
**Location:** `src/data/brokerData.ts`, `src/types/broker.ts`

Supported source types:
- **Salesforce** - CRM data, account activity
- **Outlook/Gmail** - Email threads, communication history
- **Calendar** - Meetings, scheduled events
- **HubSpot** - Engagement scores, marketing data
- **Applied Epic** - Policy management data
- **AMS360** - Agency management data
- **QuoteSys** - Quote generation and tracking

#### 5. Clients Management
**Location:** `src/pages/Clients.tsx`

- **Client directory** with search and filtering
- **Industry categorization**
- **Contact information** display
- **Policy count** per client
- **Quick actions** (email, call, view details)

#### 6. Policies Management
**Location:** `src/pages/Policies.tsx`

- **Policy listing** with status indicators
- **Carrier information**
- **Premium and coverage details**
- **Expiration tracking**
- **Filtering by status** (active, pending, expired)

#### 7. Calendar View
**Location:** `src/pages/Calendar.tsx`

- **Monthly calendar** display
- **Meeting scheduling**
- **Renewal deadline visualization**
- **Event categorization**

#### 8. Reports & Analytics
**Location:** `src/pages/Reports.tsx`

- **Revenue charts** using Recharts
- **Renewal performance** metrics
- **Pipeline analytics**
- **Trend visualization**

#### 9. Email Templates
**Location:** `src/data/brokerData.ts`

- **Renewal reminder** templates
- **Policy update** templates
- **Claims follow-up** templates
- **Variable substitution** ({{client_name}}, {{policy_type}}, etc.)

#### 10. UI/UX Foundation
- **Dark/Light mode** support
- **Responsive design** (mobile-friendly)
- **Modern component library** (shadcn/ui)
- **Smooth animations** and transitions
- **Accessibility** considerations

---

## Architecture Overview

### Current Architecture (Frontend-Only)

```
┌─────────────────────────────────────────────────────────────┐
│                      QUANTARA FRONTEND                       │
│                    (React + TypeScript)                      │
├─────────────────────────────────────────────────────────────┤
│  Pages                                                       │
│  ├── Index.tsx (Dashboard + AI Chat + Briefs)               │
│  ├── Clients.tsx (Client Management)                        │
│  ├── Policies.tsx (Policy Management)                       │
│  ├── Calendar.tsx (Scheduling)                              │
│  └── Reports.tsx (Analytics)                                │
├─────────────────────────────────────────────────────────────┤
│  Components                                                  │
│  ├── UI Components (shadcn/ui)                              │
│  ├── Common Components (SourceIcon, Skeleton)               │
│  └── NavLink (Navigation)                                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── brokerData.ts (Mock Data)                              │
│  └── broker.ts (TypeScript Types)                           │
├─────────────────────────────────────────────────────────────┤
│  Styling                                                     │
│  ├── Tailwind CSS                                           │
│  ├── CSS Variables (Theming)                                │
│  └── Custom Animations                                      │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
│                            (Zero Storage)                                    │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ Salesforce│ Outlook  │ Gmail    │ Calendar │ Broker   │ Quote Systems        │
│ HubSpot  │ Teams    │          │          │ Apps     │                      │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────────┬───────────┘
     │          │          │          │          │                │
     ▼          ▼          ▼          ▼          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONNECTOR LAYER                                      │
│                        (OAuth 2.0 / API Keys)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Unified interface per system                                              │
│  • Real-time fetch, no duplication                                          │
│  • Metadata only (IDs, timestamps)                                          │
│  • Clean JSON context output                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION + AI INTELLIGENCE ENGINE                    │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ Pipeline │Priority- │ AI Risk  │ AI Email │ AI       │ Q&A                  │
│ Builder  │ization   │ Insights │Generator │ Outreach │ Router               │
│          │ Engine   │          │          │          │                      │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────────┤
│ AI Predictive Modeling                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                     │
│                      (React + TypeScript + Tailwind)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Dashboard │ AI Chat │ Briefs │ Clients │ Policies │ Calendar │ Reports    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Deep Dive

### 1. Renewal Pipeline Intelligence

#### Current Implementation
```typescript
// src/types/broker.ts
interface Renewal {
  id: string;
  client: RenewalClient;
  policy: RenewalPolicy;
  daysUntilRenewal: number;
  riskScore: 'high' | 'medium' | 'low';
  riskFactors: string[];
  aiInsights: string[];
  aiSummary: string;
  status: 'pending' | 'in_progress' | 'at_risk' | 'secured';
}
```

#### How It Works Now
- Static mock data with pre-defined risk scores
- Manual risk factor assignment
- Pre-written AI insights

#### Production Enhancement
- **Real-time risk calculation** based on:
  - Days until renewal
  - Client engagement metrics
  - Payment history
  - Competitor activity signals
  - Industry trends
- **ML-powered churn prediction** (0-100 confidence score)
- **Auto-prioritization** based on premium value × risk score

---

### 2. AI Chat & Q&A Engine

#### Current Implementation
- Simulated streaming responses
- Pre-defined chat history
- Static source citations

#### Production Enhancement

```
┌─────────────────────────────────────────────────────────┐
│                    Q&A FLOW                              │
├─────────────────────────────────────────────────────────┤
│  User Query                                              │
│      ↓                                                   │
│  Intent Classification (LLM)                             │
│      ↓                                                   │
│  Context Retrieval (Live API calls to sources)          │
│      ↓                                                   │
│  Response Generation (OpenAI/Anthropic)                 │
│      ↓                                                   │
│  Source Attribution (100% traceability)                 │
│      ↓                                                   │
│  Streaming Response to UI                               │
└─────────────────────────────────────────────────────────┘
```

**Key Capabilities:**
- "What renewals need attention this week?"
- "Show me clients with competitor quotes"
- "Compare TechFlow's coverage to Liberty Mutual quote"
- "Draft an email to Sarah about her renewal"

---

### 3. AI-Powered Briefs

#### Current Implementation
- Static brief content
- Pre-defined agenda items
- Manual talking points

#### Production Enhancement

**One-Page Brief Generator:**
```
┌─────────────────────────────────────────────────────────┐
│                 AI BRIEF GENERATION                      │
├─────────────────────────────────────────────────────────┤
│  1. Aggregate data from all connected sources           │
│  2. Identify key risk factors and opportunities         │
│  3. Generate executive summary (3-4 sentences)          │
│  4. Create prioritized action items                     │
│  5. Suggest meeting agenda with time allocations        │
│  6. Generate talking points by category                 │
│  7. Attach source citations for every claim             │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Email Intelligence

#### Current Implementation
- Template-based emails
- Manual variable substitution

#### Production Enhancement

**AI Email Generator:**
- **Tone-based drafting** (formal, friendly, urgent)
- **Auto-context from CRM/email history**
- **Subject line optimization**
- **Personalization based on client preferences**
- **Send-time optimization**

---

## Roadmap to Production

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE

| Task | Status |
|------|--------|
| React scaffold with TypeScript | ✅ Done |
| UI component library (shadcn/ui) | ✅ Done |
| Routing and navigation | ✅ Done |
| Mock data structure | ✅ Done |
| Dashboard layout | ✅ Done |
| AI chat interface (UI) | ✅ Done |
| Brief modal (UI) | ✅ Done |

---

### Phase 2: Backend Infrastructure (Weeks 3-4) 🔄 NEXT

| Task | Priority | Effort |
|------|----------|--------|
| **Node.js/Express API server** | High | 3 days |
| **Authentication system (OAuth 2.0)** | High | 3 days |
| **Database schema (PostgreSQL)** | High | 2 days |
| **API rate limiting & security** | High | 1 day |
| **Environment configuration** | Medium | 1 day |

#### Backend Structure
```
/server
├── /src
│   ├── /controllers
│   │   ├── authController.ts
│   │   ├── renewalController.ts
│   │   ├── clientController.ts
│   │   └── aiController.ts
│   ├── /services
│   │   ├── salesforceService.ts
│   │   ├── outlookService.ts
│   │   ├── calendarService.ts
│   │   └── aiService.ts
│   ├── /connectors
│   │   ├── salesforceConnector.ts
│   │   ├── microsoftGraphConnector.ts
│   │   ├── googleConnector.ts
│   │   └── brokerAppConnector.ts
│   ├── /middleware
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   └── /utils
│       ├── encryption.ts
│       └── logger.ts
├── package.json
└── tsconfig.json
```

---

### Phase 3: Connector Integration (Weeks 5-7)

| Connector | API | Auth Method | Priority |
|-----------|-----|-------------|----------|
| **Salesforce** | REST API | OAuth 2.0 | High |
| **Microsoft 365** | Graph API | OAuth 2.0 (MSAL) | High |
| **Google Workspace** | Google APIs | OAuth 2.0 | Medium |
| **HubSpot** | REST API | OAuth 2.0 | Medium |
| **Applied Epic** | REST API | API Key | High |
| **AMS360** | SOAP/REST | API Key | Medium |

#### Connector Implementation Pattern
```typescript
// Example: Salesforce Connector
interface Connector {
  authenticate(): Promise<void>;
  fetchAccounts(): Promise<Account[]>;
  fetchActivities(accountId: string): Promise<Activity[]>;
  fetchOpportunities(): Promise<Opportunity[]>;
  disconnect(): Promise<void>;
}

class SalesforceConnector implements Connector {
  private accessToken: string;
  private instanceUrl: string;

  async authenticate(): Promise<void> {
    // OAuth 2.0 flow with PKCE
  }

  async fetchAccounts(): Promise<Account[]> {
    // Real-time fetch, no storage
    const response = await fetch(`${this.instanceUrl}/services/data/v58.0/sobjects/Account`);
    return this.transformToCleanJSON(response);
  }
}
```

---

### Phase 4: AI Intelligence Layer (Weeks 8-10)

| Feature | Model | Implementation |
|---------|-------|----------------|
| **Q&A Engine** | GPT-4 / Claude | Function calling + RAG |
| **Risk Scoring** | Custom ML | Gradient boosting classifier |
| **Email Generation** | GPT-4 | Fine-tuned on insurance emails |
| **Brief Generation** | Claude | Long-context summarization |
| **Churn Prediction** | Custom ML | Time-series analysis |

#### AI Service Architecture
```typescript
// src/services/aiService.ts
class AIService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  async answerQuestion(query: string, context: SourceContext[]): Promise<AIResponse> {
    // 1. Classify intent
    const intent = await this.classifyIntent(query);

    // 2. Fetch relevant context from connectors
    const liveData = await this.fetchLiveContext(intent);

    // 3. Generate response with citations
    const response = await this.generateResponse(query, liveData);

    // 4. Attach source attribution
    return this.attachSources(response, liveData);
  }

  async generateBrief(clientId: string): Promise<Brief> {
    // Aggregate all client data
    // Generate one-page summary
    // Create action items and talking points
  }

  async predictRenewalRisk(renewalId: string): Promise<RiskScore> {
    // ML model inference
    // Return 0-100 score with factors
  }
}
```

---

### Phase 5: Advanced Features (Weeks 11-14)

#### 5.1 Predictive Analytics Dashboard
```
┌─────────────────────────────────────────────────────────┐
│              PREDICTIVE ANALYTICS                        │
├─────────────────────────────────────────────────────────┤
│  • Renewal probability scores (0-100)                   │
│  • Revenue at risk visualization                        │
│  • Churn prediction with confidence intervals           │
│  • Upsell opportunity scoring                           │
│  • Portfolio health metrics                             │
└─────────────────────────────────────────────────────────┘
```

#### 5.2 Automated Workflows
- **Auto-email sequences** for renewal reminders
- **Smart scheduling** based on client preferences
- **Escalation triggers** for at-risk renewals
- **Task assignment** based on broker workload

#### 5.3 Real-Time Notifications
- **Push notifications** for urgent renewals
- **Email alerts** for competitor activity
- **Slack/Teams integration** for team collaboration
- **Mobile app notifications**

#### 5.4 Advanced Reporting
- **Custom report builder**
- **Export to PDF/Excel**
- **Scheduled report delivery**
- **Benchmark comparisons**

---

### Phase 6: Security & Compliance (Weeks 15-16)

| Requirement | Implementation |
|-------------|----------------|
| **Zero-Storage Architecture** | No document storage, real-time fetch only |
| **OAuth 2.0 + MFA** | MSAL for Microsoft, standard OAuth for others |
| **TLS 1.3** | HTTPS-only with certificate pinning |
| **HMAC-SHA256** | Request signing for API calls |
| **GDPR/CCPA Compliance** | Data minimization, right to deletion |
| **SOC 2 Type II** | Audit logging, access controls |
| **IP Whitelisting** | Enterprise deployment option |
| **Vault-based Secrets** | HashiCorp Vault for credentials |

---

### Phase 7: Production Deployment (Weeks 17-18)

| Task | Platform |
|------|----------|
| **Frontend Hosting** | Vercel / Netlify |
| **Backend Hosting** | AWS ECS / Google Cloud Run |
| **Database** | AWS RDS PostgreSQL |
| **Secrets Management** | AWS Secrets Manager |
| **CDN** | CloudFlare |
| **Monitoring** | DataDog / New Relic |
| **Error Tracking** | Sentry |
| **CI/CD** | GitHub Actions |

---

## Technical Implementation Plan

### New Files to Create

#### Backend
```
/server
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── oauth.ts
│   │   └── ai.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── renewal.controller.ts
│   │   ├── client.controller.ts
│   │   ├── policy.controller.ts
│   │   ├── ai.controller.ts
│   │   └── connector.controller.ts
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── renewal.service.ts
│   │   ├── brief.service.ts
│   │   └── email.service.ts
│   ├── connectors/
│   │   ├── base.connector.ts
│   │   ├── salesforce.connector.ts
│   │   ├── microsoft.connector.ts
│   │   ├── google.connector.ts
│   │   ├── hubspot.connector.ts
│   │   ├── applied.connector.ts
│   │   └── ams360.connector.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── connection.model.ts
│   │   └── audit.model.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── error.middleware.ts
│   └── utils/
│       ├── encryption.ts
│       ├── logger.ts
│       └── validators.ts
```

#### Frontend Additions
```
/src
├── api/
│   ├── client.ts (API client with auth)
│   ├── renewals.api.ts
│   ├── clients.api.ts
│   ├── ai.api.ts
│   └── connectors.api.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useRenewals.ts
│   ├── useAIChat.ts
│   └── useConnectors.ts
├── context/
│   ├── AuthContext.tsx
│   └── ConnectorContext.tsx
├── pages/
│   ├── Login.tsx
│   ├── Settings.tsx
│   └── Integrations.tsx
```

---

## Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Time per Renewal** | 60-90 min | 30 min | User surveys |
| **Renewal Rate** | Baseline | +15% | System tracking |
| **AI Answer Accuracy** | N/A | 90%+ | Human verification |
| **Source Traceability** | N/A | 100% | Automated audit |
| **User Adoption** | N/A | 80%+ | Active users/total |
| **Integration Coverage** | 0% | 80%+ | Connected sources |
| **Response Time** | N/A | <2s | Performance monitoring |
| **Uptime** | N/A | 99.9% | Infrastructure monitoring |

### User Satisfaction Metrics
- **Net Promoter Score (NPS)**: Target 50+
- **Customer Satisfaction (CSAT)**: Target 4.5/5
- **Feature Adoption Rate**: Track per feature
- **Support Ticket Volume**: Decrease over time

---

## Appendix

### A. API Endpoints (Planned)

```
Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

Renewals
GET    /api/renewals
GET    /api/renewals/:id
GET    /api/renewals/:id/brief
POST   /api/renewals/:id/actions

Clients
GET    /api/clients
GET    /api/clients/:id
GET    /api/clients/:id/policies
GET    /api/clients/:id/activity

AI
POST   /api/ai/chat
POST   /api/ai/generate-brief
POST   /api/ai/generate-email
POST   /api/ai/predict-risk

Connectors
GET    /api/connectors
POST   /api/connectors/:type/connect
DELETE /api/connectors/:type/disconnect
GET    /api/connectors/:type/status
```

### B. Environment Variables

```env
# Server
NODE_ENV=production
PORT=3001
API_URL=https://api.quantara.io

# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
JWT_EXPIRY=24h

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...

# OAuth - Salesforce
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...

# OAuth - Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# Monitoring
SENTRY_DSN=...
DATADOG_API_KEY=...
```

### C. Database Schema (Planned)

```sql
-- Users (minimal, auth only)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Connected Accounts (OAuth tokens)
CREATE TABLE connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Quantara Team | Initial documentation |

---

*This document is a living specification and will be updated as the product evolves.*
