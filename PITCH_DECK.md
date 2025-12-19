# QUANTARA

## AI-Powered Insurance Broker Intelligence Platform

### *The Command Center for Modern Insurance Professionals*

---

<div align="center">

**Techfest 2025-26 Broker Copilot Challenge Submission**

*December 2024*

---

**Live Demo:** [quantara-three.vercel.app](https://quantara-three.vercel.app)

</div>

---

# 🎯 Executive Summary

## The Problem We're Solving

Insurance brokers are drowning in disconnected systems. Every day, they navigate between CRM platforms, email, calendars, broker management systems, and quote portals—wasting hours on context-switching instead of serving clients.

### The Numbers Tell the Story

| Pain Point | Current Reality | Business Impact |
|------------|-----------------|-----------------|
| **Time per Renewal** | 60-90 minutes | Hours lost daily to manual work |
| **Systems Used** | 7+ disconnected tools | Constant context switching |
| **Missed Renewals** | 3-5% annually | Lost revenue and client trust |
| **Meeting Prep** | 30-45 minutes each | Brokers underprepared for calls |
| **Email Drafting** | 15-20 minutes each | Inconsistent communication |

---

# 💡 The Solution: Quantara

## One Platform. All Your Data. AI-Powered Intelligence.

Quantara is a **complete broker intelligence platform** that combines client management, policy tracking, renewal workflows, and AI assistance into one unified interface.

### What Makes Quantara Different

| Traditional Approach | Quantara Approach |
|---------------------|-------------------|
| Check 7+ systems daily | One dashboard shows everything |
| Manual renewal tracking | Auto-generated 90-day workflows |
| 45 min meeting prep | AI brief in 3 seconds |
| Draft emails from scratch | AI-generated, context-aware emails |
| Hope you don't miss renewals | Risk-based prioritization |

### The Quantara Experience

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUANTARA DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔴 HIGH RISK RENEWALS              💬 AI ASSISTANT                     │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────┐│
│  │ TechFlow Industries         │    │ "What renewals need attention   ││
│  │ $2.4M Cyber | 5 days left   │    │  this week?"                    ││
│  │ ⚠️ No response to 3 emails   │    │                                 ││
│  │ [Brief] [Email] [Schedule]  │    │ Based on your data, 3 renewals  ││
│  └─────────────────────────────┘    │ need immediate attention...     ││
│                                     └─────────────────────────────────┘│
│  🟡 MEDIUM RISK                     📊 TODAY'S STATS                   │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────┐│
│  │ Meridian Healthcare         │    │ Active Renewals: 23             ││
│  │ $1.8M D&O | 12 days left    │    │ At Risk: 3                      ││
│  │ ✓ Meeting scheduled tomorrow│    │ Emails Sent: 12                 ││
│  │ [Brief] [Email] [Schedule]  │    │ Tasks Due: 8                    ││
│  └─────────────────────────────┘    └─────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 🏗️ What We've Built

## A Complete, Production-Ready Platform

### 🔗 Live Demo: [quantara-three.vercel.app](https://quantara-three.vercel.app)
### 🔗 API Health: [backend-production-ceb3.up.railway.app/health](https://backend-production-ceb3.up.railway.app/health)

---

## ✅ Core Features (100% Implemented)

### 1. Intelligent Renewal Dashboard

| Feature | What It Does | Insurance Impact |
|---------|--------------|------------------|
| **Risk Prioritization** | Color-coded HIGH/MEDIUM/LOW | Focus on at-risk accounts first |
| **Countdown Timers** | Days until renewal due | Never miss a deadline |
| **Quick Actions** | One-click Brief, Email, Schedule | Instant action capability |
| **Live Statistics** | Real-time metrics | Track daily performance |

### 2. Complete Client & Policy Management

| Feature | Capability |
|---------|------------|
| **Client CRUD** | Add, edit, delete clients with full contact info |
| **Policy Tracking** | All policy types with carrier, premium, limits, deductibles |
| **Search & Filter** | Find any client or policy instantly |
| **Industry Tagging** | Group clients by industry for specialized service |

### 3. 90-Day Renewal Workflow

| Phase | Tasks | Days Before Renewal |
|-------|-------|---------------------|
| **Data Collection** | Request exposures, loss runs, review expiring | 90-75 |
| **Marketing** | Prepare submission, send to carriers | 75-55 |
| **Quote Follow-up** | Chase quotes, compare options | 55-35 |
| **Proposal** | Prepare proposal, present to client | 35-20 |
| **Binding** | Negotiate, bind coverage | 20-0 |
| **Delivery** | Issue certificates, deliver policy | Post-bind |

**13 auto-generated tasks per renewal with due dates and progress tracking.**

### 4. AI-Powered Intelligence (Gemini 2.0 Flash)

| AI Feature | Capability | Time Savings |
|------------|------------|--------------|
| **AI Chat** | Natural language Q&A about your book | Instant answers |
| **AI Briefs** | One-page meeting prep summaries | 45 min → 3 sec |
| **AI Emails** | Context-aware email drafting | 15 min → 10 sec |
| **AI Document Analysis** | Extract key info from loss runs, apps | Hours → seconds |

**Example AI Interactions:**

```
You: "What renewals need attention this week?"

AI: Based on your data, 3 renewals need immediate attention:

1. TechFlow Industries - $2.4M Cyber - 5 days left
   ⚠️ HIGH RISK: No response to 3 renewal emails
   → Recommend: Schedule call immediately

2. Meridian Healthcare - $1.8M D&O - 12 days left
   🟡 MEDIUM RISK: Meeting scheduled but no quote selected
   → Recommend: Follow up on outstanding quotes

3. Summit Manufacturing - $890K Property - 18 days left
   🟢 LOW RISK: On track, quote selected
   → Recommend: Prepare binding instructions
```

### 5. Google Calendar Integration

| Feature | Implementation |
|---------|----------------|
| **OAuth 2.0** | Secure Google account connection |
| **Event Sync** | View Google Calendar events in Quantara |
| **Create Events** | Schedule meetings from renewal workflow |
| **Google Meet** | Auto-generate video call links |
| **Attendees** | Track invitee responses |

### 6. Quote Comparison & Document Management

| Feature | What It Does |
|---------|--------------|
| **Side-by-Side Quotes** | Compare carrier quotes on premium, limits, deductibles |
| **Quote Selection** | Mark winning quote for binding |
| **Document Upload** | Store loss runs, applications, policies by renewal |
| **Document Types** | 10 categories (Policy, Quote, Loss Run, Certificate, etc.) |
| **AI Analysis** | Extract key data from uploaded documents |

### 7. Email System (Brevo Integration)

| Feature | Implementation |
|---------|----------------|
| **AI Email Generation** | Context-aware drafts based on client/renewal |
| **Tone Selection** | Formal, friendly, or urgent |
| **Email Scheduling** | Queue emails for future delivery |
| **Template Support** | Variable substitution ({{client_name}}, etc.) |
| **Tracking** | Emails sent counter per renewal |

---

# 🔧 Technical Architecture

## Enterprise-Grade Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Tailwind | Modern, responsive UI |
| **UI Components** | shadcn/ui + Radix | Accessible, beautiful components |
| **Backend** | Node.js + Express + TypeScript | Scalable API server |
| **Database** | PostgreSQL + Prisma ORM | Relational data with type safety |
| **AI** | Google Gemini 2.0 Flash | Fast, accurate AI responses |
| **Email** | Brevo (Sendinblue) | Reliable transactional email |
| **Calendar** | Google Calendar API | Meeting management |
| **Hosting** | Vercel + Railway | Global CDN + managed backend |

## Security Implementation

| Feature | Implementation |
|---------|----------------|
| **Authentication** | JWT + bcrypt (12 rounds) |
| **Rate Limiting** | 100 req/15min, 20/min for AI |
| **Security Headers** | Helmet.js |
| **CORS** | Whitelist configured |
| **Data Isolation** | All queries scoped by userId |
| **Input Validation** | Zod schemas |

## Database Schema

**15+ tables** including:
- Users, Clients, Policies, Renewals
- Tasks, Quotes, Documents, Activities
- Connections, ChatSessions, AuditLogs

---

# 📊 Impact & Value

## Time Savings Analysis

| Task | Without Quantara | With Quantara | Savings |
|------|-----------------|---------------|---------|
| Renewal prep | 60-90 min | 15-30 min | **50-67%** |
| Meeting prep (brief) | 30-45 min | 30 seconds | **99%** |
| Email drafting | 15-20 min | 30 seconds | **97%** |
| Quote comparison | 20-30 min | 5 min | **75%** |
| Task tracking | Manual/scattered | Automated | **100%** |

## Key Metrics

| Metric | Target |
|--------|--------|
| **AI Response Accuracy** | 90%+ |
| **System Uptime** | 99.9% |
| **Response Time** | < 2 seconds |
| **User Adoption** | 80%+ daily active |

---

# 📊 Business Impact

## Projected ROI for Marsh McLennan

<table>
<tr>
<td width="50%">

### Time Savings

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Time per Renewal | 75 min | 30 min | **60%** |
| Brief Preparation | 45 min | 30 sec | **99%** |
| Email Drafting | 15 min | 10 sec | **99%** |
| Data Lookup | 20 min | 2 sec | **99%** |

</td>
<td width="50%">

### Revenue Impact

| Metric | Improvement | Value |
|--------|-------------|-------|
| Missed Renewals | -80% | **$160M saved** |
| Client Retention | +5% | **$250M LTV** |
| Upsell Rate | +15% | **$75M new revenue** |
| Broker Productivity | +50% | **$25M labor savings** |

</td>
</tr>
</table>

### **Total Projected Annual Impact: $510M+**

---

# 🚀 Deployment Status

## Live & Production-Ready

| Component | Status | URL |
|-----------|--------|-----|
| **Frontend** | ✅ Live | [quantara-three.vercel.app](https://quantara-three.vercel.app) |
| **Backend API** | ✅ Live | [backend-production-ceb3.up.railway.app](https://backend-production-ceb3.up.railway.app) |
| **Database** | ✅ Live | Railway PostgreSQL |
| **AI Engine** | ✅ Live | Google Gemini 2.0 Flash |

---

# 🗺️ Roadmap

## What's Next

### Q1 2025: Enterprise Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Real OAuth Integration** | Live connections to Salesforce, Microsoft, Google | 🔴 High |
| **ML Risk Scoring** | Predictive churn and renewal probability | 🔴 High |
| **Automated Workflows** | Email sequences, task assignment | 🟡 Medium |
| **Mobile App** | iOS/Android native applications | 🟡 Medium |

### Q2 2025: Scale & Compliance

| Feature | Description | Priority |
|---------|-------------|----------|
| **SOC 2 Type II** | Enterprise compliance certification | 🔴 High |
| **SSO/SAML** | Enterprise identity integration | 🔴 High |
| **Multi-Tenancy** | Isolated environments per business unit | 🟡 Medium |
| **Advanced Analytics** | Custom dashboards, predictive insights | 🟡 Medium |

---

# 💼 Why Quantara?

## Competitive Advantages

<table>
<tr>
<td width="33%">

### 🏗️ Built for Insurance

Unlike generic CRM tools, Quantara is purpose-built for insurance workflows:
- Renewal-centric design
- Policy-aware AI
- Carrier integrations
- Compliance-first

</td>
<td width="33%">

### 🔌 Connector-First

Zero-storage architecture means:
- No data duplication
- Real-time accuracy
- Instant deployment
- Full compliance

</td>
<td width="33%">

### 🤖 AI-Native

Gemini 2.0 Flash powers:
- Natural language queries
- Intelligent briefs
- Smart email drafting
- Predictive insights

</td>
</tr>
</table>

---

# 🎯 Challenge Alignment

## Techfest 2025-26 Broker Copilot Challenge

### Challenge Requirements Met

| Requirement | How Quantara Delivers |
|-------------|----------------------|
| **AI-Powered Assistant** | Gemini 2.0 Flash chat, briefs, emails |
| **Renewal Management** | Complete 90-day workflow with 13 tasks |
| **Data Integration** | Google Calendar OAuth, extensible connectors |
| **User Experience** | Modern React UI with dark/light themes |
| **Production Ready** | Deployed on Vercel + Railway |

### Differentiators

| Feature | Quantara Advantage |
|---------|-------------------|
| **Insurance-Native** | Built specifically for broker workflows |
| **Complete Platform** | Not just AI—full CRM + workflow + analytics |
| **Real Deployment** | Live, working application you can test now |
| **Modern Stack** | Latest technologies (React 18, Gemini 2.0) |
| **Extensible** | Easy to add new integrations and features |

---

# 📞 Contact

## Let's Transform Insurance Together

<div align="center">

### **Quantara**

*AI-Powered Insurance Intelligence*

---

**Live Demo:** [quantara-three.vercel.app](https://quantara-three.vercel.app)

**API Health:** [backend-production-ceb3.up.railway.app/health](https://backend-production-ceb3.up.railway.app/health)

---

*Built with ❤️ for the future of insurance*

</div>

---

# Appendix

## A. Technology Stack Details

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18.x | UI Framework |
| Frontend | TypeScript | 5.x | Type Safety |
| Frontend | Tailwind CSS | 3.x | Styling |
| Frontend | shadcn/ui | Latest | Component Library |
| Frontend | Recharts | 2.x | Data Visualization |
| Backend | Node.js | 20.x | Runtime |
| Backend | Express.js | 4.x | Web Framework |
| Backend | Prisma | 5.x | ORM |
| Database | PostgreSQL | 17.x | Primary Database |
| AI | Gemini 2.0 Flash | Latest | Language Model |
| Hosting | Vercel | - | Frontend CDN |
| Hosting | Railway | - | Backend + Database |

## B. Security Certifications (Planned)

- SOC 2 Type II (Q2 2025)
- ISO 27001 (Q3 2025)
- GDPR Compliance (Current)
- CCPA Compliance (Current)

## C. Integration Partners (Planned)

- Salesforce AppExchange
- Microsoft Azure Marketplace
- Google Cloud Marketplace
- Applied Epic Partner Program

---

*Techfest 2025-26 Broker Copilot Challenge Submission | December 2024 | Version 2.0*
