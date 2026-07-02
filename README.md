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
├── .commandcode
│   └── taste
│       └── taste.md
├── api
│   └── http-api
│       ├── .agents
│       │   └── skills
│       │       ├── prisma-cli
│       │       │   ├── references
│       │       │   └── SKILL.md
│       │       ├── prisma-client-api
│       │       │   ├── references
│       │       │   └── SKILL.md
│       │       ├── prisma-database-setup
│       │       │   ├── references
│       │       │   └── SKILL.md
│       │       └── prisma-upgrade-v7
│       │           ├── references
│       │           └── SKILL.md
│       ├── prisma
│       │   ├── migrations
│       │   │   ├── 20260515161719_init_auth_schema
│       │   │   │   └── migration.sql
│       │   │   └── migration_lock.toml
│       │   ├── models
│       │   │   ├── auth-provider.prisma
│       │   │   ├── auth.prisma
│       │   │   └── user.prisma
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── src
│       │   ├── common
│       │   │   └── decorators
│       │   │       └── current-user.decorator.ts
│       │   ├── config
│       │   │   └── env.validation.ts
│       │   ├── lib
│       │   │   └── prisma.ts
│       │   ├── modules
│       │   │   ├── auth
│       │   │   │   ├── dto
│       │   │   │   ├── guards
│       │   │   │   ├── strategies
│       │   │   │   ├── auth.constants.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.tokens.ts
│       │   │   ├── mailer
│       │   │   │   ├── console-mail.sender.ts
│       │   │   │   ├── mail-sender.type.ts
│       │   │   │   ├── mailer.module.ts
│       │   │   │   └── resend-mail.sender.ts
│       │   │   └── users
│       │   │       ├── users.controller.ts
│       │   │       ├── users.module.ts
│       │   │       └── users.service.ts
│       │   ├── app.module.ts
│       │   ├── health.controller.ts
│       │   ├── main.ts
│       │   └── prisma.service.ts
│       ├── test
│       │   ├── app.e2e-spec.ts
│       │   └── jest-e2e.json
│       ├── .agent-changes.json
│       ├── .env.example
│       ├── .gitignore
│       ├── .prettierrc
│       ├── eslint.config.mjs
│       ├── nest-cli.json
│       ├── package.json
│       ├── prisma.config.ts
│       ├── README.md
│       ├── skills-lock.json
│       ├── SKILLS.md
│       ├── tsconfig.build.json
│       └── tsconfig.json
├── packages
│   ├── auth-client
│   │   ├── src
│   │   │   ├── api.ts
│   │   │   ├── env.ts
│   │   │   ├── index.ts
│   │   │   ├── store.ts
│   │   │   └── types.ts
│   │   ├── .agent-changes.json
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── SKILLS.md
│   │   └── tsconfig.json
│   ├── eslint-config
│   │   ├── base.js
│   │   ├── next.js
│   │   ├── package.json
│   │   ├── react-internal.js
│   │   ├── README.md
│   │   └── SKILLS.md
│   └── typescript-config
│       ├── base.json
│       ├── nest-api.json
│       ├── nextjs.json
│       ├── package.json
│       ├── react-library.json
│       ├── README.md
│       └── SKILLS.md
├── ui
│   ├── apps
│   │   └── react-app
│   │       ├── .tanstack
│   │       │   └── tmp
│   │       ├── public
│   │       │   ├── favicon.ico
│   │       │   ├── logo192.png
│   │       │   ├── logo512.png
│   │       │   ├── manifest.json
│   │       │   └── robots.txt
│   │       ├── src
│   │       │   ├── components
│   │       │   │   ├── Auth
│   │       │   │   └── ThemeToggle.tsx
│   │       │   ├── lib
│   │       │   │   └── utils.ts
│   │       │   ├── routes
│   │       │   │   ├── __root.tsx
│   │       │   │   ├── about.tsx
│   │       │   │   ├── dashboard.tsx
│   │       │   │   ├── forgot-password.tsx
│   │       │   │   ├── index.tsx
│   │       │   │   ├── login.tsx
│   │       │   │   ├── reset-password.tsx
│   │       │   │   └── signup.tsx
│   │       │   ├── router.tsx
│   │       │   ├── routeTree.gen.ts
│   │       │   └── styles.css
│   │       ├── .cta.json
│   │       ├── .cursorrules
│   │       ├── .env
│   │       ├── .env.example
│   │       ├── .gitignore
│   │       ├── components.json
│   │       ├── package.json
│   │       ├── README.md
│   │       ├── tsconfig.json
│   │       ├── tsr.config.json
│   │       └── vite.config.ts
│   └── shared
│       ├── ui-components
│       │   ├── src
│       │   │   ├── components
│       │   │   │   └── index.ts
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   └── index.ts
│       │   ├── eslint.config.js
│       │   ├── package.json
│       │   ├── postcss.config.mjs
│       │   ├── README.md
│       │   ├── SKILLS.md
│       │   └── tsconfig.json
│       ├── ui-core
│       │   ├── src
│       │   │   ├── hooks
│       │   │   │   ├── index.ts
│       │   │   │   └── use-mobile.ts
│       │   │   ├── lib
│       │   │   │   ├── index.ts
│       │   │   │   └── utils.ts
│       │   │   ├── styles
│       │   │   │   └── globals.css
│       │   │   ├── ui-core
│       │   │   │   ├── (... shadCn components)
│       │   │   └── index.ts
│       │   ├── .agent-changes.json
│       │   ├── components.json
│       │   ├── eslint.config.js
│       │   ├── package.json
│       │   ├── postcss.config.mjs
│       │   ├── SKILLS.md
│       │   ├── tsconfig.json
│       │   └── tsconfig.lint.json
│       └── ui-utils
│           ├── src
│           │   ├── constants
│           │   │   └── index.ts
│           │   ├── helpers
│           │   │   └── index.ts
│           │   ├── validators
│           │   │   └── index.ts
│           │   └── index.ts
│           ├── eslint.config.js
│           ├── package.json
│           ├── README.md
│           ├── SKILLS.md
│           └── tsconfig.json
├── .eslintrc.js
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
├── AGENTS.md
├── bun.lock
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
└── turbo.json
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

#### NestJS API Environment (apps/http-api)

Create `.env` file in `apps/http-api/`:

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
cd apps/http-api
bun run db:push
```

#### Option B: Run migrations

```bash
cd apps/http-api
bun run db:migrate
```

#### Option C: Reset database (⚠️ Warning: Deletes all data)

```bash
cd apps/http-api
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
cd apps/http-api
bun dev
```

#### Start only React App:

```bash
cd ui/apps/react-app
bun dev
```

## Database Commands

All database commands should be run from the `apps/http-api/` directory:

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
