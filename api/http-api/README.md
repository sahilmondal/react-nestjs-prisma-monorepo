# NestJS + Prisma + Resend API (`http-api`)

This is a modern, high-performance backend API built for the Turborepo monorepo. It features a complete authentication system with JWT, OAuth (Google & GitHub), and password reset capabilities.

## 🚀 Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (v11)
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Database ORM:** [Prisma](https://www.prisma.io/) (with multi-file schema support)
- **Database:** PostgreSQL
- **Authentication:** Passport.js (JWT, Google OAuth20, GitHub OAuth2)
- **Email Delivery:** [Resend](https://resend.com/)
- **Validation:** `class-validator` & Joi

## 📂 Project Structure

```text
src/
├── common/          # Global decorators, filters, interceptors
├── config/          # Environment variables validation (Joi)
├── generated/       # Auto-generated Prisma client
├── lib/             # Shared utilities (Prisma connection initialization)
├── modules/
│   ├── auth/        # Auth controllers, services, DTOs, strategies, guards
│   ├── mailer/      # Email services (Resend & Console fallback)
│   └── users/       # User management
├── app.module.ts    # Root application module
└── main.ts          # Application entry point
```

## 🛠️ Setup & Installation

1. **Install dependencies:**
   (Run from the root of the monorepo or within this app)

   ```bash
   bun install
   ```

2. **Environment Variables:**
   Copy the example environment file and configure your local settings:

   ```bash
   cp .env.example .env
   ```

   > **Note:** Ensure your `DATABASE_URL` points to a valid local PostgreSQL instance.

3. **Database Setup:**
   Generate the Prisma client and run the migrations to create the tables:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

## 🏃‍♂️ Running Locally

Start the development server with watch mode:

```bash
bun run dev
```

The API will be available at `http://localhost:3009` (or the `PORT` specified in your `.env`).

### Available Scripts

- `bun run dev` — Start the NestJS dev server in watch mode.
- `bun run start` — Run the server directly without watch mode.
- `bun run build` — Type-check the app (`tsc --noEmit`).
- `bun run db:generate` — Generate the Prisma client from the multi-file schema.
- `bun run db:push` — Push schema state directly to the database (prototyping).
- `bun run db:migrate` — Run Prisma migrations against the development database.
- `bun run db:seed` — Seed the database with initial data.

## � API Endpoints

### Health & Root

#### `GET /`

Root health check endpoint.

**Response:**

```json
{
  "ok": true,
  "service": "api"
}
```

#### `GET /health`

Detailed health status endpoint.

**Response:**

```json
{
  "status": "up"
}
```

---

### Authentication

#### `POST /auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe" // Optional
}
```

**Response (Success):**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Note:** Refresh token is set as HTTP-only cookie. Access token is returned in response.

---

#### `POST /auth/login`

Authenticate user and obtain tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (Success):**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Note:** Refresh token is set as HTTP-only cookie. Access token is returned in response.

---

#### `POST /auth/refresh`

Refresh the access token using the refresh token.

**Authentication:** Refresh token in cookies (HTTP-only)

**Response (Success):**

```json
{
  "access_token": "eyJhbGc..."
}
```

---

#### `POST /auth/logout`

Logout user and invalidate tokens.

**Authentication:** Requires valid JWT access token

**Response (Success):**

```json
{
  "ok": true
}
```

**Note:** Clears refresh token cookie and invalidates session.

---

#### `GET /auth/me`

Get current authenticated user profile.

**Authentication:** Requires valid JWT access token (Bearer token in Authorization header)

**Request Header:**

```
Authorization: Bearer eyJhbGc...
```

**Response (Success):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

#### `POST /auth/forgot-password`

Request a password reset token via email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success):**

```json
{
  "ok": true
}
```

**Note:**

- In dev mode (`MAIL_MODE=console`), the reset link prints to the terminal.
- In prod mode (`MAIL_MODE=resend`), an email is sent with the reset link.

---

#### `POST /auth/reset-password`

Reset password using a reset token.

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response (Success):**

```json
{
  "ok": true
}
```

---

#### `GET /auth/google`

Initiate Google OAuth flow.

**Notes:**

- This endpoint redirects to Google's login page.
- Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to be configured.
- Enable in `.env` by setting `GOOGLE_OAUTH_ENABLED=true`.
- Callback redirects to `/auth/google/callback`.

---

#### `GET /auth/google/callback`

Google OAuth callback handler.

**Notes:**

- Automatically called by Google after user authentication.
- On success, redirects to frontend with `?token=<access_token>&refreshToken=<refresh_token>`.
- Redirect URL is configurable via `FRONTEND_REDIRECT_URL` in `.env`.

---

#### `GET /auth/github`

Initiate GitHub OAuth flow.

**Notes:**

- This endpoint redirects to GitHub's login page.
- Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to be configured.
- Enable in `.env` by setting `GITHUB_OAUTH_ENABLED=true`.
- Callback redirects to `/auth/github/callback`.

---

#### `GET /auth/github/callback`

GitHub OAuth callback handler.

**Notes:**

- Automatically called by GitHub after user authentication.
- On success, redirects to frontend with `?token=<access_token>&refreshToken=<refresh_token>`.
- Redirect URL is configurable via `FRONTEND_REDIRECT_URL` in `.env`.

---

### Users

#### `GET /users`

Retrieve all users (basic user list without sensitive data).

**Authentication:** None required (public endpoint)

**Response (Success):**

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid2",
    "email": "jane@example.com",
    "name": "Jane Smith",
    "createdAt": "2024-01-16T10:30:00Z",
    "updatedAt": "2024-01-16T10:30:00Z"
  }
]
```

---

## �🔑 Authentication Features

- **JWT Authentication:** Secure stateless sessions using access and HTTP-only refresh cookies.
- **OAuth Integration:** Ready-to-use Google and GitHub login flows (enable them in `.env`).
- **Password Reset:** Generates secure reset tokens and sends emails via the Resend SDK.
  - _Dev mode:_ By default, `MAIL_MODE=console` is used, which prints the reset link to the terminal.
  - _Prod mode:_ Set `MAIL_MODE=resend` and provide a `RESEND_API_KEY` to send real emails.

## 🌐 Deployment

Since this app runs on Bun, you can deploy it to any environment that supports Docker or native Bun runtimes (like Railway, Render, or Fly.io).

**Pre-flight checklist:**

1. Set `NODE_ENV=production`.
2. Configure a secure, randomly generated `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars).
3. Set `FRONTEND_ORIGINS` to your production frontend URLs (comma-separated).
4. Set `MAIL_MODE=resend` and configure your `RESEND_API_KEY` and `RESEND_FROM` domain.
5. Apply database migrations during your CI/CD pipeline using `bun x prisma migrate deploy --config prisma.config.ts`.
