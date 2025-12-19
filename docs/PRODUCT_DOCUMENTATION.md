# Quantara - Product Documentation

## AI-Powered Insurance Broker Intelligence Platform

**Version 2.0 | December 2024**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Insurance Problem](#the-insurance-problem)
3. [Product Overview](#product-overview)
4. [Feature Documentation](#feature-documentation)
5. [User Personas & Use Cases](#user-personas--use-cases)
6. [Insurance Workflow Integration](#insurance-workflow-integration)
7. [Feature Testing Guide](#feature-testing-guide)
8. [Success Metrics](#success-metrics)
9. [Glossary of Insurance Terms](#glossary-of-insurance-terms)

---

## Executive Summary

### What is Quantara?

Quantara is a comprehensive AI-powered platform built specifically for insurance brokers and agencies. It serves as a central command center that unifies client management, policy tracking, renewal workflows, and AI-powered intelligence into one seamless interface.

Unlike generic CRM tools, Quantara understands the insurance industry. It knows what a "loss run" is, understands renewal cycles, and speaks the language of premiums, coverage limits, and deductibles.

### Who Is This For?

- **Independent Insurance Brokers** managing 50-500 clients
- **Insurance Agencies** with multiple brokers needing unified workflows
- **Account Managers** handling complex commercial accounts
- **Producers** focused on new business and renewals

### Key Value Propositions

| Benefit | How Quantara Delivers |
|---------|----------------------|
| **Save 50% Time Per Renewal** | Automated task workflows, AI briefs, one-click emails |
| **Never Miss a Renewal** | Intelligent pipeline with risk-based prioritization |
| **Win More Business** | AI-powered quote comparison and client insights |
| **Stay Organized** | Centralized documents, tasks, and communications |
| **Look Professional** | Polished briefs and proposals generated in seconds |

---

## The Insurance Problem

### A Day in the Life of a Broker (Before Quantara)

Picture this: It's Monday morning. Sarah, a commercial lines broker with 15 years of experience, sits down at her desk with a cup of coffee. She has 127 active clients and 23 renewals coming up in the next 60 days. Here's how her morning goes:

**8:00 AM** - Opens Outlook to check overnight emails. A client replied about their renewal quote at 11 PM. She flags it for later.

**8:15 AM** - Logs into the agency management system (Applied Epic) to check which renewals are coming up. Exports a list to Excel.

**8:30 AM** - Opens Salesforce to see the last touchpoint with TechFlow Industries—their $2.4M cyber policy renews in 12 days and she hasn't heard back from them.

**8:45 AM** - Searches through her email for the loss runs she requested last week. Can't find them. Searches "loss run" and gets 847 results.

**9:00 AM** - Gets a call from a client asking about their certificate of insurance. Puts the renewal work on hold.

**9:30 AM** - Finally starts working on the TechFlow renewal. Opens a Word document to draft an email. Realizes she needs to check what coverage they currently have...

**10:00 AM** - She's made almost no progress on her most important renewal because she's been jumping between 7 different systems.

### The Real Costs

| Problem | Impact |
|---------|--------|
| **Context Switching** | 60-90 minutes per renewal just gathering information |
| **Missed Renewals** | 3-5% of renewals fall through the cracks annually |
| **Client Churn** | Clients leave for brokers who are more responsive |
| **No Prioritization** | High-value at-risk accounts don't get attention until it's too late |
| **Manual Everything** | Every email, every brief, every follow-up is manual work |

---

## Product Overview

### How Quantara Solves This

Quantara consolidates everything Sarah needs into one intelligent interface:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUANTARA DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔴 HIGH RISK                     📊 TODAY'S STATS                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ TechFlow Industries         │  │ Renewals Due: 23                    │  │
│  │ $2.4M Cyber | 12 days       │  │ At Risk: 3                          │  │
│  │ ⚠️ No response to 3 emails   │  │ Emails Sent: 12                     │  │
│  │ [Brief] [Email] [Call]      │  │ Meetings Today: 2                   │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
│  🟡 MEDIUM RISK                   💬 AI ASSISTANT                           │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Meridian Healthcare         │  │ "What renewals need attention       │  │
│  │ $1.8M D&O | 18 days         │  │  this week?"                        │  │
│  │ ℹ️ Meeting scheduled          │  │                                     │  │
│  │ [Brief] [Email] [Call]      │  │ > Based on your data, 3 renewals... │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Description | Insurance Role |
|--------|-------------|----------------|
| **Dashboard** | Renewal pipeline with AI prioritization | Know exactly what needs attention |
| **Clients** | Client CRM with policy history | 360° view of every account |
| **Policies** | Policy management with expiration tracking | Never lose track of coverage |
| **Renewals** | Full workflow with tasks, quotes, documents | Structured renewal process |
| **Calendar** | Google Calendar integration with Meet | Schedule client meetings |
| **Reports** | Analytics and performance metrics | Measure what matters |
| **AI Chat** | Natural language assistant | Ask questions, get answers |

---

## Feature Documentation

### 1. Dashboard & Renewal Pipeline

**What It Does:**
The dashboard is the broker's daily command center. It shows all upcoming renewals prioritized by risk level, with quick actions to take immediate action.

**Insurance Role:**
- **Risk Prioritization**: High-value accounts at risk of non-renewal are surfaced first
- **Countdown Timers**: Days until renewal keeps brokers on schedule
- **Quick Actions**: One-click access to briefs, emails, and scheduling

**Key Features:**
- Renewal cards with risk indicators (HIGH/MEDIUM/LOW)
- Days until renewal countdown
- Premium and coverage limit display
- Status workflow (Pending → In Progress → Quoted → Secured)
- Real-time statistics (total renewals, at-risk count, emails sent)

---

### 2. Client Management

**What It Does:**
Comprehensive client database with all contact information, policy history, and related documents in one place.

**Insurance Role:**
- **Account History**: See all policies a client has ever had
- **Industry Tracking**: Group clients by industry for specialized service
- **Contact Management**: Never lose a client's phone number or email again

**Key Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- Search and filtering by name, company, industry
- Policy count per client
- Quick actions (email, call, view details)
- Notes field for relationship management

---

### 3. Policy Management

**What It Does:**
Track every policy with full details including carrier, premium, coverage limits, deductibles, and expiration dates.

**Insurance Role:**
- **Coverage Tracking**: Know exactly what coverage each client has
- **Expiration Alerts**: Policies expiring soon are flagged automatically
- **Carrier Relationships**: Track which carriers you place business with

**Policy Types Supported:**
| Type | Description |
|------|-------------|
| General Liability | Third-party bodily injury and property damage |
| Professional Liability (E&O) | Errors and omissions coverage |
| Cyber Liability | Data breach and cyber attack protection |
| Property | Building and contents coverage |
| Workers' Compensation | Employee injury coverage |
| Commercial Auto | Business vehicle coverage |
| Umbrella | Excess liability over primary policies |
| Directors & Officers | Management liability protection |
| Employment Practices | HR-related claims (harassment, wrongful termination) |

---

### 4. Renewal Workflow System

**What It Does:**
Structured workflow with 13 default tasks that guide brokers through the entire renewal process, from 90 days out to policy delivery.

**Insurance Role:**
This mirrors the actual renewal process that every commercial lines broker follows:

| Phase | Days Before | Tasks | Purpose |
|-------|-------------|-------|---------|
| **Data Collection** | 90-75 | Request exposures, loss runs, review expiring | Gather underwriting information |
| **Marketing** | 75-55 | Prepare submission, send to markets | Shop the account with carriers |
| **Quote Follow-up** | 55-35 | Chase quotes, compare received | Get competitive options |
| **Proposal** | 35-20 | Prepare proposal, present to client | Help client make decision |
| **Binding** | 20-0 | Negotiate, bind coverage | Finalize the transaction |
| **Post-Bind** | 0+ | Issue certificates, deliver policy | Complete the file |

**Default Task Templates:**
1. Request updated exposures from client
2. Request loss runs from expiring carrier
3. Review expiring policy terms
4. Prepare submission for marketing
5. Send submission to markets
6. Follow up on outstanding quotes
7. Compare quotes received
8. Prepare client proposal
9. Present proposal to client
10. Negotiate final terms
11. Bind coverage
12. Issue certificates of insurance
13. Deliver policy documents

---

### 5. Quote Comparison

**What It Does:**
Side-by-side comparison of carrier quotes with AI-powered analysis to help clients make informed decisions.

**Insurance Role:**
- **Premium Comparison**: See price differences at a glance
- **Coverage Analysis**: Compare limits, deductibles, exclusions
- **Recommendation Engine**: AI suggests the best value option

**Quote Fields Tracked:**
- Carrier name
- Premium (annual)
- Coverage limit (per occurrence and aggregate)
- Deductible
- Coinsurance percentage
- Exclusions (what's NOT covered)
- Endorsements (additional coverages)
- Price change vs. expiring policy

---

### 6. Document Management

**What It Does:**
Centralized document storage organized by client, policy, renewal, and quote. Supports AI analysis to extract key information.

**Insurance Role:**
Document management is critical in insurance. Every renewal involves:
- **Loss Runs**: Claims history from carriers
- **Applications**: ACORD forms and supplemental questionnaires
- **Policies**: The actual insurance contracts
- **Certificates**: Proof of insurance for clients' customers
- **Endorsements**: Policy modifications

**Document Types:**
| Type | Description | Typical Use |
|------|-------------|-------------|
| POLICY | Insurance policy documents | Reference coverage terms |
| QUOTE | Carrier quotes and proposals | Compare options |
| LOSS_RUN | Claims history reports | Underwriting review |
| APPLICATION | Insurance applications | Submission to carriers |
| CERTIFICATE | Certificates of insurance | Client's customers need these |
| ENDORSEMENT | Policy modifications | Track coverage changes |
| INVOICE | Premium invoices | Billing records |
| CLAIM | Claim documents | Claims management |
| CORRESPONDENCE | Emails and letters | Communication history |

**AI Document Analysis:**
Upload a document and the AI will:
- Summarize key points
- Extract important data (limits, premiums, dates)
- Identify risk factors
- Highlight action items

---

### 7. AI Chat Assistant

**What It Does:**
Natural language interface to ask questions about your book of business, get recommendations, and generate content.

**Insurance Role:**
Think of it as a junior broker who has memorized everything about your clients and can answer any question instantly.

**Example Queries:**
| Question | AI Response |
|----------|-------------|
| "What renewals need attention this week?" | Prioritized list with risk factors |
| "Show me all cyber policies expiring in Q1" | Filtered policy list |
| "What's TechFlow's claim history?" | Summary of past claims |
| "Draft a renewal reminder for Meridian Healthcare" | Ready-to-send email |
| "Compare the Hartford and Liberty Mutual quotes" | Side-by-side analysis |

---

### 8. AI Brief Generation

**What It Does:**
One-page client briefs for meeting preparation. Generated in seconds with executive summary, risk factors, and talking points.

**Insurance Role:**
Before every client meeting, brokers need to review:
- Current coverage
- Upcoming renewals
- Any outstanding issues
- Talking points for the conversation

The AI brief does this automatically, including:
- Executive summary of the client relationship
- Risk factors that need attention
- AI-generated insights and recommendations
- Suggested meeting agenda
- Talking points categorized by type

---

### 9. Email System

**What It Does:**
Send renewal reminders and custom emails directly from Quantara, with AI assistance for drafting.

**Insurance Role:**
Email is the primary communication channel in insurance. Common emails include:
- Renewal reminders (60, 30, 15 days out)
- Quote requests to carriers
- Proposal delivery to clients
- Certificate requests
- Follow-ups on outstanding items

**Features:**
- AI-generated email drafts
- Tone selection (formal, friendly, urgent)
- Template support with variable substitution
- Email scheduling for future delivery
- Tracking of emails sent per renewal

---

### 10. Google Calendar Integration

**What It Does:**
Two-way calendar sync with Google Calendar, including the ability to create meetings with Google Meet video conferencing.

**Insurance Role:**
Brokers have meetings constantly:
- Renewal review meetings with clients
- Stewardship meetings (annual account reviews)
- Carrier meetings
- Internal team meetings

**Features:**
- View Google Calendar events alongside renewal deadlines
- Create new events with Google Meet links
- See attendee list and response status
- Sync bidirectionally

---

### 11. Reports & Analytics

**What It Does:**
Visual dashboards showing revenue trends, renewal performance, and pipeline analytics.

**Insurance Role:**
Brokers need to track:
- Total premium under management
- Renewal retention rate
- New business vs. renewals
- Revenue by client/industry
- At-risk premium

**Available Reports:**
- Revenue by month (bar chart)
- Renewal pipeline (funnel chart)
- Risk distribution (pie chart)
- Performance trends (line chart)

---

## User Personas & Use Cases

### Persona 1: The Veteran Broker

**Profile:**
- Name: Sarah Chen
- Experience: 15+ years in commercial lines
- Book: 127 clients, $8M premium
- Pain Points: Drowning in emails, can't keep track of all renewals

**How She Uses Quantara:**

| Time | Without Quantara | With Quantara |
|------|-----------------|---------------|
| 8:00 AM | Check 3 different systems | Open Dashboard, see prioritized list |
| 8:30 AM | Search for client info | Click client card, see everything |
| 9:00 AM | Draft email from scratch | Click "Generate Email", send |
| 10:00 AM | Prepare for meeting manually | Click "Generate Brief", print |

**Key Features Used:**
- Dashboard for daily prioritization
- AI Briefs before every client meeting
- Email generation for renewal reminders
- Quote comparison for complex accounts

---

### Persona 2: The New Producer

**Profile:**
- Name: Mike Rodriguez
- Experience: 2 years, still learning
- Book: Building from scratch
- Pain Points: Doesn't know the renewal process well

**How He Uses Quantara:**

The task workflow system is his mentor:
- 13 pre-defined tasks guide him through each renewal
- Due dates keep him on track
- Categories help him understand the phases
- Progress tracking shows what's done vs. pending

**Key Features Used:**
- Task management (follows the templates)
- Document management (keeps files organized)
- AI Chat (asks questions about insurance terms)

---

### Persona 3: The Agency Manager

**Profile:**
- Name: Jennifer Walsh
- Experience: 20 years, manages team of 8 brokers
- Responsibility: Overall agency performance
- Pain Points: No visibility into team activity

**How She Uses Quantara:**

- Reports dashboard shows agency-wide metrics
- Can see at-risk renewals across all brokers
- Escalation alerts for renewals needing attention

**Key Features Used:**
- Reports & Analytics
- Dashboard filtering
- Escalation notifications

---

## Insurance Workflow Integration

### How Quantara Fits the Insurance Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMERCIAL INSURANCE LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NEW BUSINESS          SERVICING              RENEWAL                       │
│  ────────────          ─────────              ───────                       │
│  • Prospect            • Certificates         • 90-Day Notice               │
│  • Quote               • Endorsements         • Gather Info                 │
│  • Bind                • Claims               • Market                      │
│  • Deliver             • Questions            • Quote                       │
│                                               • Propose                     │
│                                               • Bind                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     QUANTARA COVERAGE                                  │ │
│  │  ✅ Client Management (New Business + Servicing)                       │ │
│  │  ✅ Policy Management (All phases)                                     │ │
│  │  ✅ Renewal Workflow (Complete automation)                             │ │
│  │  ✅ Document Management (All phases)                                   │ │
│  │  ✅ Communication (Email + Calendar)                                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The 90-Day Renewal Timeline

Here's how Quantara supports each phase of a typical commercial renewal:

**Days 90-75: Data Collection**
```
Quantara Actions:
├── Auto-creates renewal record when policy hits 90-day window
├── Generates 13 workflow tasks with due dates
├── Task 1: "Request updated exposures from client" (Due: Day 90)
├── Task 2: "Request loss runs from expiring carrier" (Due: Day 85)
└── Task 3: "Review expiring policy terms" (Due: Day 80)

Insurance Context:
- Exposures = What the client wants insured (payroll, revenue, vehicles, etc.)
- Loss runs = Claims history, critical for getting quotes
- Expiring review = Understand current coverage before shopping
```

**Days 75-55: Marketing**
```
Quantara Actions:
├── Task 4: "Prepare submission for marketing" (Due: Day 75)
├── Task 5: "Send submission to markets" (Due: Day 70)
├── Upload submission document to renewal
└── Track which carriers received the submission

Insurance Context:
- Submission = Package sent to carriers (app, loss runs, schedules)
- Markets = Insurance carriers who might quote the account
- Marketing = Shopping the account for competitive quotes
```

**Days 55-35: Quote Follow-up**
```
Quantara Actions:
├── Task 6: "Follow up on outstanding quotes" (Due: Day 55)
├── Task 7: "Compare quotes received" (Due: Day 45)
├── Enter received quotes into system
├── AI compares quotes side-by-side
└── Identify best value options

Insurance Context:
- Carriers have 2-3 weeks to respond typically
- Need at least 2-3 quotes for competitive comparison
- Compare: Premium, Limits, Deductible, Exclusions
```

**Days 35-10: Proposal & Negotiation**
```
Quantara Actions:
├── Task 8: "Prepare client proposal" (Due: Day 35)
├── Task 9: "Present proposal to client" (Due: Day 30)
├── Task 10: "Negotiate final terms" (Due: Day 20)
├── Generate AI brief for client meeting
├── Schedule meeting via Google Calendar
└── Track client's quote selection

Insurance Context:
- Proposal = Summary of options for client decision
- May need to negotiate with carrier on terms
- Client needs time to review and decide
```

**Days 10-0: Binding**
```
Quantara Actions:
├── Task 11: "Bind coverage" (Due: Day 10)
├── Mark selected quote as "bound"
├── Update renewal status to "Secured"
└── Send confirmation email to client

Insurance Context:
- Binding = Committing to the coverage
- Must happen before expiration
- "Binder" provides temporary proof of coverage
```

**Post-Bind: Delivery**
```
Quantara Actions:
├── Task 12: "Issue certificates of insurance" (Due: Day -5)
├── Task 13: "Deliver policy documents" (Due: Day 0)
├── Upload final policy documents
└── Mark renewal as complete

Insurance Context:
- Certificates = Proof of insurance for client's customers
- Policy = The actual contract (arrives 2-4 weeks after binding)
- File should be complete for audit purposes
```

---

## Feature Testing Guide

This section provides step-by-step instructions to test each feature of Quantara, along with explanations of how each feature relates to the insurance industry.

### Test 1: Authentication System

**Insurance Role:**
Data security is paramount in insurance. Client information, policy details, and financial data must be protected. Authentication ensures only authorized brokers can access their accounts.

**How to Test:**

1. **Register a New Account**
   - Go to https://quantara-three.vercel.app/login
   - Click "Create Account"
   - Enter: Email, Password, Name, Company Name
   - Click "Register"
   - Expected: Redirected to Dashboard with welcome message

2. **Login**
   - Go to /login
   - Enter credentials
   - Expected: JWT token stored, redirected to Dashboard

3. **Session Persistence**
   - Refresh the page
   - Expected: Still logged in (token persists in localStorage)

4. **Logout**
   - Click avatar → Settings → Logout
   - Expected: Redirected to login, token cleared

---

### Test 2: Client Management

**Insurance Role:**
Clients are the foundation of any insurance agency. Each client may have multiple policies across different lines of coverage. Tracking client information, industry, and contact details is essential for service and retention.

**How to Test:**

1. **Create a Client**
   - Go to Clients page
   - Click "Add Client"
   - Fill in:
     - Name: "John Smith"
     - Company: "TechFlow Industries"
     - Email: "john@techflow.com"
     - Phone: "555-123-4567"
     - Industry: "Technology"
   - Click "Create"
   - Expected: Client appears in list

2. **Search Clients**
   - Type "Tech" in search box
   - Expected: TechFlow Industries filtered

3. **Edit Client**
   - Click on client → Edit
   - Change phone number
   - Save
   - Expected: Updated information shows

4. **Delete Client**
   - Click delete icon
   - Confirm
   - Expected: Client removed from list

---

### Test 3: Policy Management

**Insurance Role:**
Policies are the products brokers sell. Each policy has specific coverage terms, limits, deductibles, and expiration dates. Tracking these details is critical for proper advice and renewal management.

**How to Test:**

1. **Create a Policy**
   - Go to Policies page
   - Click "Add Policy"
   - Fill in:
     - Client: Select "TechFlow Industries"
     - Policy Number: "GL-2024-001"
     - Type: "General Liability"
     - Carrier: "Hartford"
     - Premium: $50,000
     - Coverage Limit: $1,000,000
     - Deductible: $5,000
     - Effective Date: Today
     - Expiration Date: 1 year from now
   - Click "Create"
   - Expected: Policy appears in list

2. **Filter by Status**
   - Click "Active" filter
   - Expected: Only active policies shown

3. **Initiate Renewal**
   - Click ⋮ menu → "Initiate Renewal"
   - Expected: Renewal created, redirected to renewal detail

---

### Test 4: Renewal Workflow

**Insurance Role:**
Renewals are the lifeblood of an insurance agency. 85%+ of revenue typically comes from renewals. Managing the 90-day renewal process systematically prevents missed renewals and improves retention.

**How to Test:**

1. **View Renewal Pipeline**
   - Go to Dashboard
   - Expected: Renewal cards showing with risk indicators

2. **Open Renewal Detail**
   - Click on a renewal card
   - Expected: Renewal detail page with tabs (Tasks, Quotes, Documents)

3. **Complete Tasks**
   - Go to Tasks tab
   - Click on first task
   - Mark as "Complete"
   - Expected: Progress bar updates, task shows checkmark

4. **Check Escalations**
   - High-risk renewals should show warning indicators
   - Expected: At-risk renewals highlighted in red

---

### Test 5: Quote Comparison

**Insurance Role:**
Brokers shop accounts to multiple carriers to get competitive quotes. Comparing quotes is one of the most time-consuming parts of the renewal process. Factors to compare include premium, limits, deductibles, and exclusions.

**How to Test:**

1. **Add Quotes**
   - Open a renewal → Quotes tab
   - Click "Add Quote"
   - Enter:
     - Carrier: "Hartford"
     - Premium: $52,000
     - Coverage Limit: $1,000,000
     - Deductible: $5,000
   - Add another quote from "Liberty Mutual" at $48,000
   - Expected: Both quotes appear in list

2. **Compare Quotes**
   - View side-by-side comparison
   - Expected: Premium, limits, deductibles compared

3. **Select Quote**
   - Click "Select" on preferred quote
   - Expected: Quote marked as selected, renewal status updates

---

### Test 6: Document Management

**Insurance Role:**
Insurance is a document-heavy industry. Every renewal involves loss runs, applications, policies, certificates, and correspondence. Keeping documents organized and accessible is essential for compliance and service.

**How to Test:**

1. **Upload Document**
   - Open a renewal → Documents tab
   - Click "Upload"
   - Select a PDF file
   - Choose type: "Loss Run"
   - Click "Upload"
   - Expected: Document appears in list

2. **View Document**
   - Click on uploaded document
   - Expected: Document viewer opens

3. **AI Analysis** (if implemented)
   - Click "Analyze" on a document
   - Expected: AI extracts key information, risk factors

---

### Test 7: AI Chat

**Insurance Role:**
Brokers need quick access to information across their book of business. The AI chat allows natural language queries about clients, policies, and renewals without manually searching through data.

**How to Test:**

1. **Ask About Renewals**
   - Open AI Chat (sidebar or dashboard)
   - Type: "What renewals need attention this week?"
   - Expected: AI responds with prioritized list

2. **Ask About Client**
   - Type: "Tell me about TechFlow Industries"
   - Expected: AI provides client summary

3. **Generate Content**
   - Type: "Draft an email to John about his renewal"
   - Expected: AI generates personalized email

---

### Test 8: AI Brief Generation

**Insurance Role:**
Before client meetings, brokers need to review account history, coverage, and talking points. Manually preparing this takes 30-45 minutes. AI briefs do this in seconds.

**How to Test:**

1. **Generate Brief**
   - Go to Dashboard
   - Click "Brief" button on a renewal card
   - Expected: Brief modal opens with:
     - Executive summary
     - Risk factors
     - AI insights
     - Talking points

2. **Review Content**
   - Check that brief includes relevant client and policy information
   - Expected: Accurate, professional summary

---

### Test 9: Email System

**Insurance Role:**
Email is the primary communication channel with clients. Renewal reminders, quote delivery, and follow-ups all happen via email. Tracking emails sent per renewal helps ensure no communication gaps.

**How to Test:**

1. **Send Renewal Reminder**
   - Open a renewal
   - Click "Send Email"
   - Expected: Email dialog opens with pre-filled template

2. **AI Email Generation**
   - Click "Generate with AI"
   - Select tone (Formal/Friendly)
   - Expected: AI-generated email appears

3. **Schedule Email**
   - Toggle "Schedule for later"
   - Select date/time
   - Click "Schedule"
   - Expected: Email queued for future delivery

---

### Test 10: Google Calendar Integration

**Insurance Role:**
Brokers have constant meetings—renewal reviews, stewardship meetings, carrier appointments. Integrating with Google Calendar ensures meetings are tracked and video conferencing is easy to set up.

**How to Test:**

1. **Connect Google Account**
   - Go to Calendar page
   - Click "Connect Google"
   - Complete OAuth flow
   - Expected: "Google Connected" badge appears

2. **View Calendar Events**
   - Expected: Google Calendar events display alongside local events

3. **Create Event with Google Meet**
   - Click "New Event"
   - Fill in details
   - Check "Sync to Google Calendar"
   - Check "Add Google Meet video call"
   - Click "Create"
   - Expected: Event created with Meet link

4. **Join Meeting**
   - Click on event with Meet link
   - Click "Join Meeting"
   - Expected: Opens Google Meet in new tab

---

### Test 11: Reports & Analytics

**Insurance Role:**
Agency managers need visibility into performance metrics—premium under management, renewal retention rates, at-risk accounts. Reports help identify trends and focus areas.

**How to Test:**

1. **View Dashboard Stats**
   - Go to Dashboard
   - Expected: Statistics cards show totals

2. **View Reports Page**
   - Go to Reports
   - Expected: Charts showing:
     - Revenue trends
     - Renewal pipeline
     - Risk distribution

---

## Success Metrics

### Key Performance Indicators

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time per Renewal** | 30 minutes (from 60-90) | Time tracking |
| **Renewal Retention Rate** | 95%+ | Renewals secured / total |
| **AI Accuracy** | 90%+ | User feedback |
| **User Adoption** | 80%+ daily active | Login tracking |
| **System Uptime** | 99.9% | Monitoring |

### Insurance-Specific Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Premium Retention** | 95% | Premium renewed vs expiring |
| **Quote Ratio** | 3:1 | Quotes received per renewal |
| **Task Completion** | 100% | All 13 tasks completed |
| **Email Response Rate** | 40%+ | Client responses to outreach |

---

## Glossary of Insurance Terms

| Term | Definition |
|------|------------|
| **Premium** | The amount paid for insurance coverage, usually annual |
| **Coverage Limit** | Maximum amount the insurance will pay for a claim |
| **Deductible** | Amount the insured pays before insurance kicks in |
| **Loss Run** | Claims history report from carriers |
| **Submission** | Package of information sent to carriers for quotes |
| **Binding** | Committing to a policy, making coverage effective |
| **Certificate of Insurance** | Proof of coverage provided to third parties |
| **Endorsement** | Modification to a policy adding or removing coverage |
| **ACORD Form** | Standardized insurance application forms |
| **E&O (Errors & Omissions)** | Professional liability coverage |
| **D&O (Directors & Officers)** | Management liability coverage |
| **EPLI (Employment Practices)** | Coverage for HR-related claims |
| **Coinsurance** | Percentage of loss the insured must pay |
| **Aggregate Limit** | Maximum total payout per policy period |
| **Per Occurrence Limit** | Maximum payout per single claim |
| **Carrier** | Insurance company providing coverage |
| **Broker** | Licensed professional who sells insurance |
| **Book of Business** | Total client accounts managed by a broker |
| **Stewardship Meeting** | Annual account review with client |
| **Marketing** | Process of shopping an account to carriers |

---

## Live URLs

| Environment | URL |
|-------------|-----|
| **Production Frontend** | https://quantara-three.vercel.app |
| **Production Backend** | https://backend-production-ceb3.up.railway.app |
| **API Health Check** | https://backend-production-ceb3.up.railway.app/health |
| **API Documentation** | https://backend-production-ceb3.up.railway.app/docs |

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Quantara Team | Initial documentation |
| 2.0 | Dec 2024 | Quantara Team | Complete rewrite with testing guide |

---

*This document is maintained as part of the Techfest 2025-26 Broker Copilot Challenge submission.*
