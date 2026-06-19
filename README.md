# Next.js + NestJS Auth Turborepo

A full-stack monorepo with Next.js frontend, NestJS backend, Prisma ORM, and comprehensive authentication.

## Tech Stack

### Frontend

- **Framework**: Next.js 16.2.6
- **UI Library**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript 5.9.3
- **State Management**: React Hook Form + Zod
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
next-nest-auth-turborepo/
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
│   └── nextjs-app/                 # Next.js Frontend (Port 3001)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx            # Home page
│       │   ├── login/              # Login page
│       │   ├── signup/             # Sign up page
│       │   ├── forgot-password/    # Forgot password page
│       │   ├── reset-password/     # Reset password page
│       │   ├── dashboard/          # Dashboard page (protected)
│       │   └── globals.css
│       ├── components/
│       │   └── dashboard/
│       ├── public/
│       ├── ui-core/                # Custom theme provider
│       └── package.json
│
├── packages/
│   ├── auth-client/                # Auth API client library
│   │   ├── src/
│   │   │   ├── api.ts              # API client
│   │   │   ├── store.ts            # Auth state management
│   │   │   ├── types.ts            # Type definitions
│   │   │   └── env.ts              # Environment config
│   │   └── package.json
│   │
│   ├── ui/                         # Shared UI components (shadcn/ui)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── Auth/           # Authentication UI components
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── styles/
│   │   │   └── ui-core/            # shadcn/ui components
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
cd next-nest-auth-turborepo
```

### 2. Setup Environment Variables

#### NestJS API Environment (apps/nestjs-prisma-api)

Create `.env` file in `apps/nestjs-prisma-api/`:

```env
# nestjs-prisma-api — copy to `.env` in this folder

NODE_ENV=development
PORT=3009
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_prisma

# JWT
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars-long!!
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7

# CORS / URLs
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001
API_PUBLIC_URL=http://localhost:3009
OAUTH_SUCCESS_REDIRECT=http://localhost:3001/dashboard // Set to your frontend dashboard or home page
PASSWORD_RESET_URL_BASE=http://localhost:3001/reset-password // Set to your frontend password reset page

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

#### Next.js App Environment (apps/nextjs-app)

Create `.env.local` file in `apps/nextjs-app/`:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3009 // URL of the NestJS API
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false // Set to true if enabling Google OAuth in the backend
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=false // Set to true if enabling GitHub OAuth in the backend
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

- **Next.js Frontend**: http://localhost:3001
- **NestJS API**: http://localhost:3009

### Alternative: Run Apps Individually

#### Start only NestJS API:

```bash
cd apps/nestjs-prisma-api
bun dev
```

#### Start only Next.js App:

```bash
cd apps/nextjs-app
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

### NestJS API Scripts

From `apps/nestjs-prisma-api/`:

```bash
bun run dev          # Start dev server with watch
bun run build        # Build production bundle
bun run start        # Start production server
bun run test         # Run unit tests
bun run test:e2e     # Run E2E tests
bun run lint         # Lint code
bun run format       # Format code
```

### Next.js App Scripts

From `apps/nextjs-app/`:

```bash
bun run dev          # Start dev server (port 3001)
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Lint code
bun run format       # Format code
bun run typecheck    # Type check
```

## Adding Components

To add a new shadcn/ui component to the shared UI package:

```bash
cd packages/ui
bunx --bun shadcn@latest add button
```

This will place the UI component in the `packages/ui/src/components` directory.

## Using Shared Components

Import components from the `@workspace/ui-core` package:

```tsx
import { Button, Card, Input } from "@workspace/ui-core";
```

## Using Auth Client

Import the auth client from `@workspace/auth-client`:

```tsx
import { useAuth, apiClient } from "@workspace/auth-client";
```

## Project Features

### Authentication Module

- JWT-based authentication
- Passport.js integration (JWT, Google, GitHub strategies)
- Secure password hashing with Argon2
- Email verification support
- Password reset functionality
- OAuth provider integration

### User Management

- User registration and login
- Profile management
- Account security features
- User preferences

### Email Service

- Email notifications via Resend
- Welcome emails
- Password reset emails
- Verification emails

### Frontend

- Responsive design with Tailwind CSS
- shadcn/ui components
- Form validation with React Hook Form + Zod
- Protected routes for authenticated users
- Authentication UI pages (login, signup, forgot password, reset password)

## Troubleshooting

### Prisma Generation Issues

If you encounter Prisma generation issues, try:

```bash
cd apps/nestjs-prisma-api
rm -rf node_modules/.prisma
bun run db:generate
```

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check database credentials and permissions

### Port Already in Use

- **Next.js**: Configure different port in `apps/nextjs-app/package.json`
- **NestJS**: Change `PORT` environment variable in `.env`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `bun lint` and `bun format`
4. Run `bun typecheck` to verify types
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
