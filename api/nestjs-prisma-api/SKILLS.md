---
title: NestJS Prisma API - Skills & Architecture
version: 1.0.0
lastUpdated: 2026-05-18
toolsSupported: [copilot, claude-code, gemini, antigravity, opencode, codex]
tags: [nestjs, backend, auth, prisma, postgresql, jwt, oauth]
---

# NestJS Prisma API - Skills & Architecture

Full-stack authentication API built with NestJS, Prisma ORM, PostgreSQL, and Passport.js. Supports JWT, OAuth2 (Google/GitHub), and refresh token patterns with email-based password recovery.

**Location**: `apps/nestjs-prisma-api/`  
**Port**: 3009 (development)  
**Runtime**: Node 20+ or Bun 1.2.6+  
**Package Manager**: Bun

## Core Architecture

### NestJS Modular Structure

```
AppModule (root)
├── ConfigModule           # Environment validation + JWT config
├── MailerModule          # Email service (factory pattern: console/resend)
├── UsersModule           # User CRUD, email lookups
├── AuthModule            # Auth logic, strategies, controllers
└── HealthController      # GET /health, GET /
```

**Key Pattern**: Strict dependency flow: Config → Mailer → Users → Auth. Modules are organized by feature, DI container manages singletons.

### Dependency Injection

All services are provided as singletons via NestJS DI. Constructor injection is used throughout:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private mailService: MailService,
    @Inject('JWT_SECRET') private jwtSecret: string,
  ) {}
}
```

**ConfigModule**: Uses Joi for runtime validation. If env vars missing/invalid, app crashes at startup (fail-safe).

## Module Organization

### 1. **Auth Module** (`src/modules/auth/`)

**Purpose**: Authentication logic, API endpoints, Passport strategies

**Files**:

- `auth.controller.ts` — 10 endpoints (register, login, refresh, logout, forgot-password, reset-password, OAuth callbacks, me endpoint)
- `auth.service.ts` — Core business logic (password hashing, token generation, OAuth profile handling)
- `auth.module.ts` — Module definition, strategy registration, feature guards
- `auth.constants.ts` — Magic strings, token types
- `strategies/` — Passport strategies (jwt.strategy.ts, google.strategy.ts, github.strategy.ts)
- `dto/` — Data Transfer Objects (register, login, forgot-password, reset-password)
- `utils/` — Token utilities, password hashing (Argon2id), timing-safe comparison

**Endpoints**:

| Method | Route                   | Auth     | Purpose                                           |
| ------ | ----------------------- | -------- | ------------------------------------------------- |
| POST   | `/auth/register`        | No       | Create account (email + password + optional name) |
| POST   | `/auth/login`           | No       | Login (email + password) → JWT + refresh cookie   |
| POST   | `/auth/refresh`         | No\*     | Refresh JWT using refresh_token cookie            |
| POST   | `/auth/logout`          | JWT      | Revoke session, clear cookie                      |
| GET    | `/auth/me`              | JWT      | Get current user (email + ID)                     |
| POST   | `/auth/forgot-password` | No       | Send password reset email                         |
| POST   | `/auth/reset-password`  | No       | Reset password with token                         |
| GET    | `/auth/google`          | No       | Initiate Google OAuth                             |
| GET    | `/auth/google/callback` | Passport | Google OAuth callback                             |
| GET    | `/auth/github`          | No       | Initiate GitHub OAuth                             |
| GET    | `/auth/github/callback` | Passport | GitHub OAuth callback                             |

\*`/auth/refresh` requires HttpOnly cookie but no JWT header.

**Guards**:

- `@UseGuards(AuthGuard('jwt'))` — Validates JWT, extracts user to `req.user`
- `GoogleEnabledGuard` — Checks if Google OAuth is enabled, otherwise 403
- `GithubEnabledGuard` — Checks if GitHub OAuth is enabled, otherwise 403

### 2. **Users Module** (`src/modules/users/`)

**Purpose**: User CRUD operations, lookups

**Files**:

- `users.service.ts` — Create, read, update, delete operations
- `users.controller.ts` — GET endpoints (list users, get by ID)

**Key Methods**:

- `findByEmail(email)` — Find user by email (used during login/register)
- `create(email, passwordHash, name?)` — Create new user
- `updatePassword(userId, newHash)` — Used in password reset flow
- `findById(id)` — Get user by ID

### 3. **Mailer Module** (`src/modules/mailer/`)

**Purpose**: Email abstraction layer

**Factory Pattern**:

- **Development**: `ConsoleMailSender` (logs emails to console)
- **Production**: `ResendMailSender` (sends via Resend API)

**Controlled by**: `MAIL_MODE` environment variable

**Methods**:

- `sendPasswordResetEmail(email, resetUrl, userName?)` — Send password reset link
- `sendVerificationEmail(email, verifyUrl)` — (Currently unused, prepared for future)

**Key Detail**: Reset URL is constructed by backend with token, passed to email template.

### 4. **Config Module** (`src/config/`)

**File**: `env.validation.ts` — Joi schema enforces type safety at startup

**Validated Environment Variables**:

```typescript
// Core
NODE_ENV: 'development' | 'production' | 'test' (default: development)
PORT: number (default: 3009)
DATABASE_URL: string (required, PostgreSQL connection string)

// JWT
JWT_ACCESS_SECRET: string (min 32 chars, required)
ACCESS_TOKEN_TTL: string (format: "15m", "1h", default: "15m")
REFRESH_TOKEN_TTL_DAYS: number (default: 7)

// URLs
FRONTEND_ORIGINS: string (comma-separated, required)
API_PUBLIC_URL: string (URI, default: http://localhost:3009)
OAUTH_SUCCESS_REDIRECT: string (URI, default: http://localhost:3001/dashboard)
PASSWORD_RESET_URL_BASE: string (URI, default: http://localhost:3001/reset-password)

// OAuth (conditional)
AUTH_GOOGLE_ENABLED: boolean (default: false)
GOOGLE_CLIENT_ID: string (required if Google enabled)
GOOGLE_CLIENT_SECRET: string (required if Google enabled)
AUTH_GITHUB_ENABLED: boolean (default: false)
GITHUB_CLIENT_ID: string (required if GitHub enabled)
GITHUB_CLIENT_SECRET: string (required if GitHub enabled)

// Email
MAIL_MODE: 'console' | 'resend' (default: console)
RESEND_API_KEY: string (required if MAIL_MODE=resend)
RESEND_FROM: string (sender email, default: noreply@localhost)
```

## Authentication Strategies

### 1. JWT Access Token

**Strategy**: `JwtStrategy` (`strategies/jwt.strategy.ts`)

- **Extraction**: Bearer token from Authorization header
- **Validation**: Signature verified using `JWT_ACCESS_SECRET`
- **Payload**: `{ sub: userId, email: userEmail }`
- **TTL**: 15 minutes (configurable via `ACCESS_TOKEN_TTL`)
- **Usage**: Protected endpoints decorated with `@UseGuards(AuthGuard('jwt'))`

**Flow**:

1. Passport extracts Bearer token
2. Verifies signature and expiration
3. If valid, adds user object to `req.user`
4. If invalid/expired, throws 401 UnauthorizedException

### 2. Refresh Token (HttpOnly Cookie)

**Pattern**: Token Rotation for Enhanced Security

- **Storage**: HttpOnly, secure, sameSite cookie named `refresh_token`
- **Value Format**: `{tokenId}.{secret}` (only secret in cookie)
- **Token Hash**: SHA256 hash of `{tokenId}.{secret}` stored in DB
- **Validation**: Timing-safe comparison to prevent timing attacks

**Database Model**:

```prisma
model RefreshToken {
  id                String    @id @default(cuid())
  userId            String    @db.Uuid
  tokenHash         String    // SHA256 of tokenId.secret
  expiresAt         DateTime  @db.Timestamptz
  revokedAt         DateTime? @db.Timestamptz  // Revocation timestamp
  replacedByTokenId String?   // Token rotation chain
  userAgent         String?   // Device fingerprint
  ip                String?   // IP address (security audit)
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Refresh Endpoint** (`POST /auth/refresh`):

1. Extract `refresh_token` cookie
2. Hash the secret part
3. Find token in DB matching hash
4. Verify not revoked, not expired
5. Generate new JWT
6. Mark old token as `revokedAt`, new token as `replacedByTokenId` (rotation)
7. Set new cookie with new token
8. Return new JWT

**Benefits**: Compromised refresh token is time-limited; rotation creates audit trail.

### 3. OAuth2 (Google & GitHub)

**Strategies**: `GoogleStrategy` & `GithubStrategy` (Passport plugins)

#### Google OAuth

- **Library**: `passport-google-oauth20`
- **Scope**: `profile email`
- **Callback URL**: `{API_PUBLIC_URL}/auth/google/callback`
- **Flow**:
  1. `GET /auth/google` redirects to Google login
  2. User logs in, consents
  3. Google redirects to callback with `code`
  4. Backend exchanges code for access token
  5. Fetches user profile (email, name, picture)
  6. Calls `completeOAuth(profile, req, res)`

#### GitHub OAuth

- **Library**: `passport-github2`
- **Scope**: `user:email`
- **Note**: GitHub may not return email; falls back to `{username}@users.noreply.github.com`
- **Flow**: Same as Google

#### OAuth Callback Handler (`completeOAuth` in `auth.service.ts`):

```
1. Check if AuthProvider exists (userId + provider link)
2. If yes: Login user (generate JWT + refresh token)
3. If no:
   a. Check if email exists (user already has account)
   b. If yes: Link OAuth provider to existing account
   c. If no: Create new user + link OAuth provider
4. Generate JWT + refresh token
5. Set refresh_token cookie
6. Redirect to OAUTH_SUCCESS_REDIRECT?accessToken={jwt}
```

**Data Model**:

```prisma
model AuthProvider {
  id              String   @id @default(cuid())
  userId          String   @db.Uuid
  provider        String   // "google" | "github"
  providerUserId  String   // Provider's user ID
  createdAt       DateTime @default(now()) @db.Timestamptz
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId]) // One OAuth account per provider
}
```

### 4. Password Reset Flow

**Models**:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String    @db.Uuid
  tokenHash String    // SHA256 of full token
  expiresAt DateTime  @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz  // One-time use
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Flow**:

1. User submits email to `POST /auth/forgot-password`
2. Backend finds user by email
3. Generates secure token, creates PasswordResetToken record with SHA256 hash
4. Sends email with reset URL: `{PASSWORD_RESET_URL_BASE}?token={urlEncodedToken}`
5. User clicks link, submits new password to `POST /auth/reset-password`
6. Backend finds token by hash, validates not expired, not used
7. Updates user password hash, marks token as `usedAt`
8. Returns success
9. **Security**: If user not found (forgot-password), returns success anyway (don't leak email existence)

## Database Schema

**File**: `prisma/schema.prisma` (imports models from `prisma/models/`)

### Models

#### User

```prisma
model User {
  id              String             @id @default(uuid()) @db.Uuid
  email           String             @unique @db.Citext  // Case-insensitive
  passwordHash    String?
  emailVerifiedAt DateTime?          @db.Timestamptz
  name            String?
  createdAt       DateTime           @default(now()) @db.Timestamptz
  updatedAt       DateTime           @updatedAt @db.Timestamptz
  refreshTokens   RefreshToken[]
  resetTokens     PasswordResetToken[]
  authProviders   AuthProvider[]
}
```

**Key Details**:

- Email uses `@db.Citext` (case-insensitive) for PostgreSQL
- `passwordHash` optional (OAuth users may not have password)
- Cascading delete on user deletion (all related tokens, providers deleted)

#### RefreshToken, PasswordResetToken, AuthProvider

See sections above under Authentication Strategies.

### Key Database Conventions

- **UUIDs for User ID**: `@id @default(uuid()) @db.Uuid`
- **Citext for emails**: Case-insensitive, UNIQUE constraint works correctly
- **Timestamps**: `@db.Timestamptz` (PostgreSQL timezone-aware)
- **Hashes in DB**: Never store plaintext tokens; always hash (SHA256 or PBKDF2)
- **Cascading deletes**: User deletion cascades to tokens, providers
- **Timestamps for audit**: `createdAt`, `updatedAt`, `expiresAt`, `revokedAt`, `usedAt`

## Middleware & Decorators

### Global Middleware Stack (order in `main.ts`)

1. **Cookie Parser** (`cookieParser()`)
   - Parses `refresh_token` cookie into `req.cookies`
   - Required for refresh token handling

2. **CORS** (`CorsModule.register()`)
   - Dynamic origin validation from `FRONTEND_ORIGINS` env
   - `credentials: true` (allows cookies)
   - Methods: GET, POST, PUT, DELETE, PATCH
   - Preflight requests: 200 OK

3. **Global Validation Pipe** (`ValidationPipe`)
   - Whitelist: Strips unknown properties
   - Forbid: Throws error if unknown properties present
   - Transform: Auto-converts types (string to number, etc.)
   - Applied to all DTOs

### Custom Decorators

**`@CurrentUser()` Decorator** (`src/common/decorators/current-user.decorator.ts`)

```typescript
@CurrentUser() currentUser  // In a controller method
// Returns: { userId: string, email: string }
// Throws: UnauthorizedException if not authenticated
```

Usage:

```typescript
@Get('me')
@UseGuards(AuthGuard('jwt'))
me(@CurrentUser() user: { userId: string; email: string }) {
  return user;
}
```

## API Endpoints Reference

See [INTEGRATION-GUIDE.md](../../INTEGRATION-GUIDE.md) for request/response examples.

### Auth Endpoints

**POST /auth/register**

- Body: `{ email, password, name? }`
- Response: `{ accessToken, user: { id, email, name } }`
- Errors: 400 (invalid input), 409 (email exists)

**POST /auth/login**

- Body: `{ email, password }`
- Response: `{ accessToken, user: { id, email, name } }`
- Sets: `refresh_token` HttpOnly cookie
- Errors: 400, 401 (invalid credentials)

**POST /auth/refresh**

- Body: Empty (reads refresh_token cookie)
- Response: `{ accessToken }`
- Sets: New `refresh_token` cookie (rotated)
- Errors: 401 (invalid/expired/revoked token)

**POST /auth/logout**

- Auth: Required (JWT)
- Body: Empty
- Response: `{ message: "Logged out successfully" }`
- Effect: Revokes refresh token, clears cookie

**GET /auth/me**

- Auth: Required (JWT)
- Response: `{ id, email, name }`
- Errors: 401 (expired JWT)

**POST /auth/forgot-password**

- Body: `{ email }`
- Response: `{ message: "Email sent" }` (always, even if email not found)
- Effect: Sends password reset link (if user found)

**POST /auth/reset-password**

- Body: `{ token, password }`
- Response: `{ message: "Password reset successfully" }`
- Errors: 400 (token expired/invalid), 422 (already used)

**GET /auth/google**

- Redirects to Google login (no auth required)

**GET /auth/google/callback**

- Handles OAuth callback
- Sets: `refresh_token` cookie
- Redirects: `{OAUTH_SUCCESS_REDIRECT}?accessToken={jwt}`

**GET /auth/github**

- Redirects to GitHub login

**GET /auth/github/callback**

- Handles OAuth callback
- Sets: `refresh_token` cookie
- Redirects: `{OAUTH_SUCCESS_REDIRECT}?accessToken={jwt}`

### Health Endpoints

**GET /health**

- Response: `{ status: "up" }`

**GET /**

- Response: `{ ok: true, service: "api" }`

## TypeScript Configuration

**File**: `tsconfig.json`

- **Target**: ES2022 (modern JavaScript)
- **Module**: ESNext (preserves import/export)
- **ModuleResolution**: Bundler (Node.js-compatible)
- **Strict**: true (all strict checks enabled)
- **Lib**: ["ES2022"]
- **Decorators**: "experimentalDecorators" + "emitDecoratorMetadata" (NestJS requirement)
- **Paths**: None (no aliases, direct imports)
- **OutDir**: `dist/`

**Key Setting**: Strict mode enforced (null checks, no implicit any).

## Dependencies & Versions

**Key Production Dependencies**:

- `@nestjs/common`: 10.x (NestJS core)
- `@nestjs/config`: 3.x (environment validation)
- `@nestjs/core`: 10.x
- `@nestjs/jwt`: 12.x (JWT integration)
- `@nestjs/passport`: 10.x (authentication)
- `passport`: 0.7.x (base strategy framework)
- `passport-jwt`: 4.x (JWT strategy)
- `passport-google-oauth20`: 2.x (Google OAuth)
- `passport-github2`: 0.1.12 (GitHub OAuth)
- `@prisma/client`: Latest (database ORM)
- `@prisma/adapter-pg`: Latest (PostgreSQL adapter with connection pooling)
- `prisma`: Latest (CLI, migrations)
- `argon2`: ^0.31.x (password hashing)
- `@joi/joi`: ^19.x (environment validation)
- `resend`: ^3.x (email service)
- `cookie-parser`: ^1.4.x (HTTP cookie parsing)
- `class-validator`: ^0.14.x (DTO validation)
- `class-transformer`: ^0.5.x (DTO transformation)

**DevDependencies**:

- `@nestjs/cli`: 10.x
- `@nestjs/testing`: 10.x
- `@types/express`: ^4.17.x
- `@types/node`: ^20.x
- TypeScript, ESLint, Prettier

See `package.json` for exact versions.

## Common Development Workflows

### Adding a New Auth Endpoint

1. **Create DTO** (`src/modules/auth/dto/new-feature.dto.ts`):

   ```typescript
   export class NewFeatureDto {
     @IsEmail() email: string;
     @MinLength(8) password: string;
   }
   ```

2. **Add Service Method** (`src/modules/auth/auth.service.ts`):

   ```typescript
   async handleNewFeature(data: NewFeatureDto) {
     // Business logic
   }
   ```

3. **Add Controller Endpoint** (`src/modules/auth/auth.controller.ts`):

   ```typescript
   @Post('new-feature')
   @UseGuards(AuthGuard('jwt')) // If protected
   async newFeature(@Body() dto: NewFeatureDto, @CurrentUser() user) {
     return this.authService.handleNewFeature(dto);
   }
   ```

4. **Add to auth-client** (`packages/auth-client/src/api.ts`):

   ```typescript
   export function newFeatureRequest(baseUrl, data) {
     return requestJson(`${baseUrl}/auth/new-feature`, {
       method: 'POST',
       body: JSON.stringify(data),
     });
   }
   ```

5. **Export from auth-client** (`packages/auth-client/src/index.ts`):

   ```typescript
   export { newFeatureRequest } from './api';
   ```

6. **Use in frontend** (nextjs-app):
   ```typescript
   const response = await newFeatureRequest(apiBaseUrl, { email, password });
   ```

### Adding an OAuth Provider (e.g., Discord)

1. **Install strategy**: `bun add passport-discord`

2. **Create strategy file** (`src/modules/auth/strategies/discord.strategy.ts`):

   ```typescript
   @Injectable()
   export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
     constructor() {
       super({
         clientID: process.env.DISCORD_CLIENT_ID,
         clientSecret: process.env.DISCORD_CLIENT_SECRET,
         callbackURL: `${process.env.API_PUBLIC_URL}/auth/discord/callback`,
         scope: ['identify', 'email'],
       });
     }

     async validate(accessToken, refreshToken, profile) {
       return profile;
     }
   }
   ```

3. **Add guard** (`src/modules/auth/guards/discord-enabled.guard.ts`):

   ```typescript
   @Injectable()
   export class DiscordEnabledGuard implements CanActivate {
     canActivate() {
       return process.env.AUTH_DISCORD_ENABLED === 'true';
     }
   }
   ```

4. **Add endpoints** (`src/modules/auth/auth.controller.ts`):

   ```typescript
   @Get('discord')
   @UseGuards(DiscordEnabledGuard)
   discord() {
     // Passport handles redirect
   }

   @Get('discord/callback')
   @UseGuards(Passport.authenticate('discord'))
   discordCallback(@Req() req, @Res() res) {
     return this.completeOAuth(req.user, req, res);
   }
   ```

5. **Add environment variables** to `env.validation.ts`:

   ```typescript
   AUTH_DISCORD_ENABLED: Joi.boolean().default(false),
   DISCORD_CLIENT_ID: Joi.string().when('AUTH_DISCORD_ENABLED', {
     is: true,
     then: Joi.required(),
   }),
   DISCORD_CLIENT_SECRET: Joi.string().when('AUTH_DISCORD_ENABLED', {
     is: true,
     then: Joi.required(),
   }),
   ```

6. **Update frontend oauth-buttons.tsx** to show Discord button

### Modifying Database Schema

1. **Update Prisma model** (`prisma/models/user.prisma` or create new file):

   ```prisma
   model User {
     // existing fields
     phoneNumber String?  @db.Phone
   }
   ```

2. **Create migration**:

   ```bash
   cd apps/nestjs-prisma-api
   bun run prisma migrate dev --name add_phone_number
   ```

3. **Review migration** in `prisma/migrations/{timestamp}_add_phone_number/migration.sql`

4. **Regenerate Prisma client** (automatic with migrate dev):

   ```bash
   bun run prisma generate
   ```

5. **Type-safe in code** (`src/generated/prisma/client.ts` auto-updated)

### Running Migrations in Production

1. **Create migration locally**, test with `prisma migrate resolve`
2. **Deploy code first** (database changes backward-compatible)
3. **Run on production DB**:
   ```bash
   DATABASE_URL=<prod-url> bun run prisma migrate deploy
   ```
4. **Verify**: `bun run prisma migrate status`

## Gotchas & Anti-patterns

❌ **Don't**:

- Modify `src/generated/prisma/` files directly (auto-generated, will be overwritten)
- Store plaintext tokens in DB (always hash with SHA256 or Argon2)
- Forget to set `credentials: true` in CORS config (refresh cookie won't be sent)
- Use same JWT secret in development and production
- Enable OAuth without setting HTTPS in production (secure cookies require it)
- Hardcode URLs; use environment variables
- Skip environment validation on startup
- Forget to hash refresh tokens before storing
- Use weak passwords for `JWT_ACCESS_SECRET` (min 32 chars recommended)

✅ **Do**:

- Keep JWT short-lived (15m) with refresh token rotation
- Hash all tokens before storing (SHA256 for tokens, Argon2id for passwords)
- Use timing-safe comparison for token validation (prevents timing attacks)
- Validate environment variables at startup (fail fast)
- Implement refresh token rotation (mark old token when issuing new)
- Set `HttpOnly`, `Secure`, `SameSite` on refresh token cookie
- Use PostgreSQL connection pooling (Prisma adapter handles this)
- Log auth events (login, logout, password reset) for audit trails
- Test OAuth flow end-to-end in staging before production
- Keep migration files; never delete them

## File Structure

```
apps/nestjs-prisma-api/
├── src/
│   ├── app.module.ts              # Root module
│   ├── main.ts                    # Entry point, middleware setup
│   ├── health.controller.ts       # GET /health, GET /
│   ├── prisma.service.ts          # Singleton DB client
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.constants.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── github.strategy.ts
│   │   │   └── utils/
│   │   │       ├── token.utils.ts
│   │   │       └── hash.utils.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── mailer/
│   │   │   ├── mailer.service.ts
│   │   │   ├── mailer.module.ts
│   │   │   ├── providers/
│   │   │   │   ├── console.provider.ts
│   │   │   │   └── resend.provider.ts
│   │   │   └── types/
│   ├── config/
│   │   └── env.validation.ts      # Joi schema
│   ├── common/
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── lib/
│   │   └── prisma.ts              # Adapter setup
│   └── generated/
│       └── prisma/                # Auto-generated (don't edit)
├── prisma/
│   ├── schema.prisma              # Main schema
│   ├── models/                    # Split models
│   │   ├── auth.prisma
│   │   ├── user.prisma
│   │   └── auth-provider.prisma
│   ├── seed.ts                    # Database seeding
│   ├── prisma.config.ts           # Custom config
│   └── migrations/
│       └── {timestamp}_{name}/
│           └── migration.sql
├── dist/                          # Compiled output (gitignore)
├── package.json
├── tsconfig.json
└── README.md
```

## When to Update This Skills File

Agents should update this file after:

- ✅ Adding/modifying authentication endpoints
- ✅ Changing authentication strategies (new OAuth provider, new token mechanism)
- ✅ Modifying database schema (update Database Schema section)
- ✅ Adding/changing guards or decorators
- ✅ Adding/changing middleware
- ✅ Updating major dependencies
- ❌ NOT for: Fixing a bug in a service, refactoring code within existing patterns, minor fixes

For small changes (new endpoint following existing pattern, new service method), update in the auth-client SKILLS if client-facing, otherwise just document in "Recently Added" section.

---

## See Also

- [packages/auth-client/SKILLS.md](../../packages/auth-client/SKILLS.md) — API client contract
- [INTEGRATION-GUIDE.md](../../INTEGRATION-GUIDE.md) — Full auth flow with examples
- [docs/AI_AGENT_UPDATES.md](../../docs/AI_AGENT_UPDATES.md) — How to update SKILLS files

## Recently Added by AI Agents

(Updated by agents when making changes)

- **2026-05-18**: Initial comprehensive skills documentation created, covering all modules, auth strategies, database schema, and common workflows
