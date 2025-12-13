# Quantara API Server

Backend API server for Quantara - AI-Powered Insurance Intelligence Platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini 2.0 Flash
- **Authentication**: JWT with bcrypt

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `PORT` | Server port (default: 3001) | No |
| `CORS_ORIGIN` | Frontend URL for CORS (default: http://localhost:8080) | No |

### OAuth Configuration (Optional)

For connector integrations, configure these OAuth credentials:

- **Salesforce**: `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`
- **Microsoft 365**: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`
- **Google Workspace**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **HubSpot**: `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Renewals
- `GET /api/renewals` - List renewals (with filters)
- `GET /api/renewals/:id` - Get renewal details
- `GET /api/renewals/upcoming/list` - Get upcoming renewals
- `GET /api/renewals/at-risk/list` - Get at-risk renewals

### Clients
- `GET /api/clients` - List clients (with search)
- `GET /api/clients/:id` - Get client details
- `GET /api/clients/:id/policies` - Get client policies

### Policies
- `GET /api/policies` - List policies (with filters)
- `GET /api/policies/:id` - Get policy details
- `GET /api/policies/expiring/list` - Get expiring policies

### AI (Gemini 2.0 Flash)
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/brief` - Generate client brief
- `POST /api/ai/email` - Generate email draft
- `GET /api/ai/status` - Check AI configuration

### Connectors
- `GET /api/connectors` - List connector status
- `GET /api/connectors/:type/auth-url` - Get OAuth URL
- `POST /api/connectors/:type/connect` - Connect service
- `DELETE /api/connectors/:type` - Disconnect service
- `POST /api/connectors/:type/sync` - Sync data

### Health
- `GET /health` - Health check

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Database

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema to database (development only)
npm run db:push
```

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utilities
│   ├── app.ts             # Express app setup
│   └── index.ts           # Entry point
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```
