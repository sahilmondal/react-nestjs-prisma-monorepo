---
title: Auth Client Library - Skills & API Contract
version: 1.0.0
lastUpdated: 2026-05-18
toolsSupported: [copilot, claude-code, gemini, antigravity, opencode, codex]
tags: [auth-client, api-client, frontend, state-management, typescript]
---

# Auth Client Library - Skills & API Contract

Lightweight, framework-agnostic HTTP client library for authentication API. Handles JWT, refresh tokens, and OAuth flows. Used by Next.js frontend and any other client consuming the authentication API.

**Location**: `packages/auth-client/`  
**Primary Export**: `useAuthStore()` (Zustand store)  
**Package Manager**: Bun

## Architecture Overview

**Purpose**: Encapsulate all API communication and auth state management in a single reusable package.

**Key Modules**:

1. `api.ts` — HTTP request functions (fetch wrapper)
2. `store.ts` — Zustand store for auth state
3. `types.ts` — TypeScript interfaces (DTOs)
4. `env.ts` — Environment variable loading (Next.js + Vite dual support)
5. `index.ts` — Main exports

**No Dependencies on Frameworks**: Pure TypeScript/JavaScript. Works with:

- React (via Zustand)
- Vue (via custom store wrapper)
- Vanilla JavaScript (direct API calls)
- Bun/Node.js scripts

## Environment Configuration

**File**: `src/env.ts`

Handles dual build environments:

```typescript
export function getPublicAuthEnv() {
  let apiBaseUrl = 'http://localhost:3000'; // fallback
  let googleEnabled = false;
  let githubEnabled = false;

  // Next.js
  if (typeof process !== 'undefined' && process.env) {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || apiBaseUrl;
    googleEnabled = isTruthy(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED);
    githubEnabled = isTruthy(process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED);
  }

  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    apiBaseUrl = import.meta.env.VITE_API_URL || apiBaseUrl;
    googleEnabled = isTruthy(import.meta.env.VITE_AUTH_GOOGLE_ENABLED);
    githubEnabled = isTruthy(import.meta.env.VITE_AUTH_GITHUB_ENABLED);
  }

  return { apiBaseUrl, googleEnabled, githubEnabled };
}

function isTruthy(value: string | undefined): boolean {
  return ['1', 'true', 'yes'].includes(value?.toLowerCase() ?? '');
}
```

**Environment Variables Required**:

| Variable                          | Environment | Required | Default                 | Purpose                         |
| --------------------------------- | ----------- | -------- | ----------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`             | Next.js     | No       | `http://localhost:3000` | API base URL                    |
| `VITE_API_URL`                    | Vite        | No       | `http://localhost:3000` | API base URL (Vite)             |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | Next.js     | No       | `false`                 | Show Google OAuth button        |
| `VITE_AUTH_GOOGLE_ENABLED`        | Vite        | No       | `false`                 | Show Google OAuth button (Vite) |
| `NEXT_PUBLIC_AUTH_GITHUB_ENABLED` | Next.js     | No       | `false`                 | Show GitHub OAuth button        |
| `VITE_AUTH_GITHUB_ENABLED`        | Vite        | No       | `false`                 | Show GitHub OAuth button (Vite) |

## API Client (`src/api.ts`)

### Core Request Function

```typescript
async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T>
```

**Features**:

- Automatic JSON parsing
- Bearer token in Authorization header (if provided)
- `credentials: 'include'` for cookie handling (refresh token)
- Error handling with `AuthApiError`

**Example**:

```typescript
const response = await requestJson<{ id: string }>(
  'http://localhost:3009',
  '/auth/me',
  {
    headers: { Authorization: `Bearer ${jwt}` },
  }
);
```

### Exported API Methods

#### Authentication

**`registerRequest(baseUrl, data)`**

```typescript
registerRequest(baseUrl, {
  email: 'user@example.com',
  password: 'secure123',
  name: 'John Doe', // optional
})

// Returns: { accessToken: string, user: { id, email, name } }
// Throws: AuthApiError (400, 409 conflict)
```

**`loginRequest(baseUrl, data)`**

```typescript
loginRequest(baseUrl, {
  email: 'user@example.com',
  password: 'secure123',
})

// Returns: { accessToken: string, user: { id, email, name } }
// Side effect: Sets refresh_token HttpOnly cookie
// Throws: AuthApiError (401 invalid credentials)
```

**`refreshRequest(baseUrl)`**

```typescript
refreshRequest(baseUrl)

// Returns: { accessToken: string }
// Note: No body needed; refresh_token sent via cookie (credentials: 'include')
// Side effect: Sets new refresh_token cookie (rotation)
// Throws: AuthApiError (401 invalid/expired/revoked token)
```

**`logoutRequest(baseUrl)`**

```typescript
logoutRequest(baseUrl)

// Returns: { message: "Logged out successfully" }
// Side effect: Clears refresh_token cookie
// Throws: AuthApiError
```

**`meRequest(baseUrl, accessToken)`**

```typescript
meRequest(baseUrl, accessToken)

// Returns: { id: string, email: string, name: string | null }
// Requires: Valid JWT accessToken in Bearer header
// Throws: AuthApiError (401 expired JWT)
```

#### Password Recovery

**`forgotPasswordRequest(baseUrl, data)`**

```typescript
forgotPasswordRequest(baseUrl, { email: 'user@example.com' })

// Returns: { message: "Check your email" }
// Note: Returns success even if email doesn't exist (security: no email enumeration)
// Side effect: Sends password reset email if user found
// Throws: AuthApiError
```

**`resetPasswordRequest(baseUrl, data)`**

```typescript
resetPasswordRequest(baseUrl, {
  token: 'URLencodedToken...',
  password: 'newPassword123',
})

// Returns: { message: "Password reset successfully" }
// Throws: AuthApiError (400 token expired, 422 token already used)
```

#### OAuth

**`oauthStartUrl(baseUrl, provider)`**

```typescript
oauthStartUrl('http://localhost:3009', 'google')
// Returns: 'http://localhost:3009/auth/google'

oauthStartUrl('http://localhost:3009', 'github')
// Returns: 'http://localhost:3009/auth/github'
```

**Usage**: Set `window.location.href = oauthStartUrl(baseUrl, provider)` to initiate OAuth flow.

**OAuth Flow** (handled by backend):

1. Frontend redirects to `{baseUrl}/auth/{provider}`
2. Backend redirects to provider login
3. Provider redirects back to callback
4. Backend generates JWT + refresh token, sets cookie
5. Backend redirects to `OAUTH_SUCCESS_REDIRECT?accessToken={jwt}`
6. Frontend extracts JWT from query param, stores in Zustand store

## Type Definitions (`src/types.ts`)

### Request DTOs

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}
```

### Response DTOs

```typescript
interface AuthResponse {
  accessToken: string;
  user: User;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface RefreshResponse {
  accessToken: string;
}

interface MessageResponse {
  message: string;
}
```

## Zustand Store (`src/store.ts`)

### Store Interface

```typescript
interface AuthStore {
  // State
  user: User | null;
  status: AuthStatus; // IDLE, LOADING, AUTHENTICATED, UNAUTHENTICATED
  accessToken: string | null;

  // Actions
  register(email: string, password: string, name?: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  hydrate(): Promise<void>; // Attempts to refresh JWT via /auth/refresh
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // ... implementation
}));
```

### AuthStatus Enum

```typescript
enum AuthStatus {
  IDLE = 'IDLE',                       // Initial state
  LOADING = 'LOADING',                 // Attempting to hydrate or call API
  AUTHENTICATED = 'AUTHENTICATED',     // User logged in, JWT valid
  UNAUTHENTICATED = 'UNAUTHENTICATED', // No JWT, user logged out
}
```

### Usage in Components

```typescript
'use client';

import { useAuthStore } from '@workspace/auth-client';

export function MyComponent() {
  const { user, status, login, logout } = useAuthStore();

  if (status === AuthStatus.LOADING) {
    return <div>Loading...</div>;
  }

  if (status === AuthStatus.UNAUTHENTICATED) {
    return <button onClick={() => login('user@example.com', 'password')}>Login</button>;
  }

  return (
    <div>
      Welcome, {user?.email}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Error Handling

### AuthApiError Class

```typescript
class AuthApiError extends Error {
  status: number;          // HTTP status (400, 401, 409, etc.)
  body: unknown;           // Raw response body
  message: string;         // User-friendly message

  constructor(status: number, body: unknown) {
    // Extracts message from:
    // 1. body.message (if string)
    // 2. body.message (if array, joins with ', ')
    // 3. Default error text based on status code
    super(message);
    this.status = status;
    this.body = body;
  }
}
```

### Error Handling Pattern

```typescript
try {
  await useAuthStore().login(email, password);
} catch (error) {
  if (error instanceof AuthApiError) {
    if (error.status === 401) {
      // Invalid credentials
    } else if (error.status === 400) {
      // Validation error (invalid email format, etc.)
    }
    console.error(error.message);
  }
}
```

### Common Error Statuses

| Status | Scenario                    | Message                                      | Action                              |
| ------ | --------------------------- | -------------------------------------------- | ----------------------------------- |
| 400    | Invalid request             | "Invalid email format" or validation message | Show form error                     |
| 401    | Invalid JWT or credentials  | "Unauthorized"                               | Redirect to login                   |
| 409    | Email already exists        | "Email already in use"                       | Show form error                     |
| 422    | Password token already used | "Reset token already used"                   | Redirect to forgot-password         |
| 500    | Server error                | "Internal server error"                      | Show generic error, contact support |

## Token Management

### JWT Storage Strategy

**Frontend**:

- JWT stored in **memory** (Zustand store)
- Sent via `Authorization: Bearer {jwt}` header
- Lost on page refresh (intended, triggers refresh token flow)

**Security Rationale**:

- Memory storage: Protected from XSS attacks (can't be stolen via `document.cookie`)
- Refresh token in HttpOnly cookie: Protected from XSS, cannot be accessed by JavaScript

### Refresh Flow (Automatic via `hydrate()`)

On page load or when JWT needed:

```typescript
const { hydrate } = useAuthStore();
useEffect(() => {
  hydrate(); // Automatically attempts /auth/refresh with cookie
}, []);
```

**Flow**:

1. Call `POST /auth/refresh` (no body, credentials: 'include')
2. Server validates refresh token from cookie
3. Returns new JWT + sets new refresh cookie
4. Store updates state with new JWT
5. If 401, user marked as UNAUTHENTICATED, redirected to login

### Token Rotation

Server-side pattern (transparent to client):

- Old refresh token marked `revokedAt`
- New refresh token issued with `replacedByTokenId` chain
- Supports replay detection (can track token compromise)

## Integration Checklist

### Setting Up in Next.js

1. **Install package** (already in workspace):

   ```typescript
   import { useAuthStore } from '@workspace/auth-client';
   ```

2. **Set environment variables** (`.env.local`):

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3009
   NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false
   ```

3. **Use in components** (must be Client Components):

   ```typescript
   'use client';
   const { user, status, login } = useAuthStore();
   ```

4. **Initialize store on page load** (in root layout or top-level component):

   ```typescript
   useEffect(() => {
     useAuthStore().hydrate();
   }, []);
   ```

5. **Protect routes** with `RequireAuth` wrapper

### Setting Up in Other Frameworks (Vue, etc.)

1. **Create reactive wrapper**:

   ```typescript
   // Vue example
   import { reactive } from 'vue';
   import { useAuthStore } from '@workspace/auth-client';

   export function useAuth() {
     const store = useAuthStore();
     return reactive({
       user: store.user,
       status: store.status,
       login: store.login,
       logout: store.logout,
     });
   }
   ```

2. **Use in components**:
   ```vue
   <script setup>
   import { useAuth } from "@/composables/useAuth"
   const { user, login } = useAuth()
   </script>
   ```

## Dependencies & Versions

**Production**:

- `zustand`: ^4.x (state management)
- No fetch polyfill (Node 18+ / modern browsers included)

**DevDependencies**:

- `typescript`: 5.9.3
- ESLint, Prettier (via shared configs)

**Zero External Dependencies** for HTTP: Uses native `fetch()` API (available in:

- Modern browsers (Chrome 40+, Firefox 39+, Safari 10.1+, Edge 14+)
- Node 18+
- Bun 1.x

## Common Development Workflows

### Adding a New API Endpoint

1. **Add request function** in `src/api.ts`:

   ```typescript
   export async function newFeatureRequest(baseUrl: string, data: NewFeatureRequest) {
     return requestJson<NewFeatureResponse>(
       baseUrl,
       '/auth/new-feature',
       {
         method: 'POST',
         body: JSON.stringify(data),
       }
     );
   }
   ```

2. **Add types** in `src/types.ts`:

   ```typescript
   interface NewFeatureRequest {
     field: string;
   }
   interface NewFeatureResponse {
     id: string;
   }
   ```

3. **Add store action** in `src/store.ts`:

   ```typescript
   async newFeature(data: NewFeatureRequest) {
     set({ status: AuthStatus.LOADING });
     const response = await newFeatureRequest(apiBaseUrl, data);
     set({ status: AuthStatus.AUTHENTICATED });
     return response;
   }
   ```

4. **Export from index** in `src/index.ts`:

   ```typescript
   export { newFeatureRequest } from './api';
   export type { NewFeatureRequest, NewFeatureResponse } from './types';
   ```

5. **Use in frontend**:
   ```typescript
   const { newFeature } = useAuthStore();
   await newFeature({ field: 'value' });
   ```

### Handling Concurrent Requests

Zustand handles concurrent calls automatically:

```typescript
// These run in parallel, store updates based on latest response
Promise.all([
  useAuthStore().hydrate(),
  useAuthStore().login(email, password),
])
  .catch(error => console.error('One failed', error));
```

### Adding Request Interceptors

Modify `requestJson()` in `api.ts`:

```typescript
async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  // Pre-request: Add custom headers, logging
  console.log(`[API] ${init?.method || 'GET'} ${path}`);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  // Post-response: Log, transform, retry logic
  if (!response.ok) {
    const body = await parseJsonSafely(response);
    throw new AuthApiError(response.status, body);
  }

  return parseJsonSafely(response);
}
```

## Gotchas & Anti-patterns

❌ **Don't**:

- Store JWT in localStorage (XSS vulnerability) — memory is safe
- Forget `credentials: 'include'` on refresh requests (cookie won't be sent)
- Call `useAuthStore()` multiple times in same component (use at top of function)
- Assume JWT is always valid (always check `hydrate()` result and handle 401)
- Hardcode API URL (use env var via `getPublicAuthEnv()`)
- Ignore `AuthApiError` exceptions (always handle explicitly)
- Forget to set `NEXT_PUBLIC_` prefix on Next.js env vars (they won't be public)

✅ **Do**:

- Use `hydrate()` on app initialization (attempts refresh token validation)
- Always handle `AuthApiError` in try/catch blocks
- Check `status === AuthStatus.AUTHENTICATED` before accessing `user`
- Store state via Zustand (single source of truth)
- Use `AuthStatus` enum for status checks (never compare strings)
- Test refresh flow: Logout, refresh page, should redirect to login
- Use TypeScript interfaces for all request/response DTOs
- Test OAuth flow: Click provider button, verify JWT extracted from redirect

## File Structure

```
packages/auth-client/
├── src/
│   ├── api.ts                  # HTTP request functions (8 methods)
│   ├── store.ts                # Zustand store (AuthStore interface)
│   ├── types.ts                # TypeScript interfaces (DTOs)
│   ├── env.ts                  # Environment loading (Next.js + Vite)
│   └── index.ts                # Main export (useAuthStore, API methods, types)
├── package.json
├── tsconfig.json
├── README.md
└── dist/                       # Compiled output (gitignore)
```

## When to Update This Skills File

Agents should update this file after:

- ✅ Adding new API methods or endpoints
- ✅ Changing request/response contracts
- ✅ Adding new store actions or state
- ✅ Modifying error handling strategy
- ✅ Supporting new frameworks or build tools
- ❌ NOT for: Internal refactoring, bug fixes, minor optimizations

---

## See Also

- [apps/nextjs-app/SKILLS.md](../../apps/nextjs-app/SKILLS.md) — Frontend usage
- [apps/http-api/SKILLS.md](../../apps/http-api/SKILLS.md) — Backend API
- [INTEGRATION-GUIDE.md](../../INTEGRATION-GUIDE.md) — Full auth flow with examples

## Recently Added by AI Agents

(Updated by agents when making changes)

- **2026-05-18**: Initial comprehensive skills documentation created
