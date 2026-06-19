# React + NestJS Auth Turborepo

A full-stack monorepo with React frontend (Vite + TanStack Router), NestJS backend, Prisma ORM, and comprehensive authentication.

## Tech Stack

### Frontend

- **Framework**: React 19 + Vite + TanStack Router
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **Language**: TypeScript 6.0.2
- **State Management**: Zustand + React Hook Form + Zod
- **Package Manager**: bun 1.2.6

### Backend

- **Framework**: NestJS 11.1.17
- **ORM**: Prisma 7.8.0 with PostgreSQL
- **Authentication**: Passport.js with JWT, Google OAuth 2.0, GitHub OAuth 2.0
- **Password Hashing**: Argon2
- **Validation**: class-validator + Joi
- **Language**: TypeScript 5.9.3
- **Email**: Resend

### Monorepo Management

- **Workspace Tool**: Turbo 2.8.17
- **Node Version**: >= 20

## Project Structure

```
react-nestjs-prisma-monorepo/
├── apps/
│   ├── nestjs-prisma-api/          # NestJS Backend API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Authentication module (JWT, Passport)
│   │   │   │   ├── users/          # User management
│   │   │   │   └── mailer/         # Email service
│   │   │   ├── config/             # Environment validation
│   │   │   ├── common/             # Decorators & common utilities
│   │   │   ├── generated/          # Prisma generated types
│   │   │   ├── lib/                # Prisma client setup
│   │   │   ├── app.module.ts       # Main app module
│   │   │   ├── main.ts             # App entry point
│   │   │   └── prisma.service.ts   # Prisma service
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   ├── models/
│   │   │   │   ├── user.prisma
│   │   │   │   ├── auth.prisma
│   │   │   │   └── auth-provider.prisma
│   │   │   ├── migrations/         # Database migrations
│   │   │   └── seed.ts             # Database seeding
│   │   ├── test/                   # E2E tests
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── react-app/                  # React Frontend (Port 3000)
│       ├── src/
│       │   ├── components/         # Local UI components (Header, ThemeToggle)
│       │   │   └── Auth/           # Auth feature (login, signup, auth forms, Auth Guard)
│       │   ├── routes/             # TanStack Router file-based routes
│       │   │   ├── __root.tsx      # Root layout
│       │   │   ├── index.tsx       # Home page
│       │   │   ├── login.tsx       # Login page
│       │   │   ├── signup.tsx      # Sign up page
│       │   │   ├── forgot-password.tsx
│       │   │   ├── reset-password.tsx
│       │   │   └── dashboard.tsx   # Dashboard page (protected)
│       │   ├── lib/
│       │   ├── router.tsx
│       │   ├── routeTree.gen.ts    # Generated routes
│       │   └── styles.css
│       ├── vite.config.ts
│       ├── tsr.config.json
│       └── package.json
│
├── packages/
│   ├── auth-client/                # Auth API client library
│   │   ├── src/
│   │   │   ├── api.ts              # API client
│   │   │   ├── store.ts            # Auth state management (Zustand)
│   │   │   ├── types.ts            # Type definitions
│   │   │   └── env.ts              # Environment config
│   │   └── package.json
│   │
│   ├── ui/                         # Shared UI components
│   │   ├── shared/
│   │   │   ├── ui-components/      # Reusable features (Shared layouts/shells)
│   │   │   ├── ui-core/            # shadcn/ui components (Buttons, Inputs)
│   │   │   └── ui-utils/           # Tailwind utils (cn)
│   │   └── package.json
│   │
│   ├── eslint-config/              # Shared ESLint configs
│   └── typescript-config/          # Shared TypeScript configs
│
├── docs/
├── turbo.json                      # Turbo configuration
├── tsconfig.json                   # Root TypeScript config
└── package.json
```

## Authentication Features

- **JWT Authentication**: Secure token-based authentication
- **Google OAuth 2.0**: Configurable via environment variables
- **GitHub OAuth 2.0**: Configurable via environment variables
- **Password Hashing**: Argon2 for secure password storage
- **Email Verification**: Using Resend service
- **Password Reset**: Secure password reset flow

## Getting Started

### Prerequisites

- **Node.js**: >= 20
- **bun**: 1.2.6+ (package manager)
- **PostgreSQL**: Database for NestJS API

### 1. Clone the Repository

```bash
git clone <repository-url>
cd react-nestjs-prisma-monorepo
```

### 2. Setup Environment Variables

#### NestJS API Environment (apps/nestjs-prisma-api)

Create `.env` file in `apps/nestjs-prisma-api/`:

```env
NODE_ENV=development
PORT=3009
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_prisma

# JWT
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars-long!!
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7

# CORS / URLs
FRONTEND_ORIGINS=http://localhost:3000
API_PUBLIC_URL=http://localhost:3009
OAUTH_SUCCESS_REDIRECT=http://localhost:3000/dashboard // Set to your frontend dashboard
PASSWORD_RESET_URL_BASE=http://localhost:3000/reset-password // Set to your frontend password reset page

# OAuth (disabled by default — set client IDs when enabling)
AUTH_GOOGLE_ENABLED=false
AUTH_GITHUB_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Mail — set MAIL_MODE=resend and fill RESEND_API_KEY for production
MAIL_MODE=console
RESEND_API_KEY=
RESEND_FROM=noreply@yourdomain.com
```

#### React App Environment (ui/apps/react-app)

Create `.env` file in `ui/apps/react-app/`:

```env
VITE_API_URL=http://localhost:3009
VITE_AUTH_GOOGLE_ENABLED=false
VITE_AUTH_GITHUB_ENABLED=false
```

### 3. Install Dependencies

```bash
bun install
```

This will automatically generate Prisma Client via the `postinstall` script.

### 4. Setup Database

Run one of the following commands based on your needs:

#### Option A: Push schema to database (recommended for fresh start)

```bash
cd apps/nestjs-prisma-api
bun run db:push
```

#### Option B: Run migrations

```bash
cd apps/nestjs-prisma-api
bun run db:migrate
```

#### Option C: Reset database (⚠️ Warning: Deletes all data)

```bash
cd apps/nestjs-prisma-api
bun run db:reset
```

### 5. Start Development Server

From the root directory, run:

```bash
bun dev
```

This will start both applications simultaneously:

- **React Frontend**: http://localhost:3000
- **NestJS API**: http://localhost:3009

### Alternative: Run Apps Individually

#### Start only NestJS API:

```bash
cd apps/nestjs-prisma-api
bun dev
```

#### Start only React App:

```bash
cd ui/apps/react-app
bun dev
```

## Database Commands

All database commands should be run from the `apps/nestjs-prisma-api/` directory:

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database (no migration files)
bun run db:push

# Create and run a migration
bun run db:migrate

# Seed database with sample data
bun run db:seed

# Open Prisma Studio (visual DB editor)
bun run db:studio

# Reset database (⚠️ Deletes all data)
bun run db:reset
```

## Development Scripts

### Root Scripts (Turbo)

```bash
# Install dependencies for all apps
bun install

# Start all apps in development mode
bun run dev

# Build all apps
bun run build

# Lint all apps
bun run lint

# Format code in all apps
bun run format

# Type check all apps
bun run typecheck
```

## Adding Components

To add a new shadcn/ui component to the shared UI package:

```bash
cd ui/shared/ui-core
bunx --bun shadcn@latest add button
```

## Using Shared Components

Import components from the `@workspace/ui-core` package:

```tsx
import { Button, Card, Input } from "@workspace/ui-core";
```

## Using Auth Client

Import the auth client from `@workspace/auth-client`:

```tsx
import { useAuthStore, loginRequest } from "@workspace/auth-client";
```
