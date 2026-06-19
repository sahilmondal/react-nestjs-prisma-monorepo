---
title: Next.js Frontend App - Skills & Architecture
version: 1.0.0
lastUpdated: 2026-05-18
toolsSupported: [copilot, claude-code, gemini, antigravity, opencode, codex]
tags: [nextjs, frontend, react, auth, tailwind, forms]
---

# Next.js Frontend App - Skills & Architecture

Modern React 19 frontend with Next.js 16 App Router. Handles authentication (login, signup, password recovery), OAuth (Google/GitHub), and dashboard with client-side state management via custom store pattern.

**Location**: `apps/nextjs-app/`  
**Port**: 3001 (development)  
**Package Manager**: Bun

## Next.js Configuration

**File**: `next.config.ts`

```typescript
const nextConfig = {
  transpilePackages: ['@workspace/ui-core', '@workspace/auth-client'],
  // ... other config
};
```

**Key Details**:

- Monorepo packages (`@workspace/ui-core`, `@workspace/auth-client`) are transpiled for client use
- No custom webpack, image optimization, or API routes (all auth handled by backend)

## Page Structure & Routing

**File-based App Router** (Next.js 16):

```
app/
├── layout.tsx                    # Root layout (ThemeProvider)
├── globals.css                   # Global Tailwind styles
├── page.tsx                      # / — Home page
├── login/
│   └── page.tsx                  # /login — LoginForm
├── signup/
│   └── page.tsx                  # /signup — SignupForm
├── forgot-password/
│   └── page.tsx                  # /forgot-password — ForgotPasswordForm
├── reset-password/
│   └── page.tsx                  # /reset-password — ResetPasswordForm (with Suspense)
└── dashboard/
    └── page.tsx                  # /dashboard — Protected route
```

### Page Components

#### Root Layout (`app/layout.tsx`)

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**Details**:

- `suppressHydrationWarning` prevents hydration mismatch in ThemeProvider
- `antialiased` Tailwind class for text rendering
- Global styles imported from `@workspace/ui-core/globals.css`

#### Home Page (`app/page.tsx`)

- Navigation links: Sign Up, Log In, Dashboard
- Simple hero section
- No auth required

#### Login Page (`app/login/page.tsx`)

```typescript
export default function LoginPage() {
  return (
    <AuthShell
      title="Login"
      description="Sign in to your account"
      footer={/* "Don't have an account?" link */}
    >
      <LoginForm />
    </AuthShell>
  );
}
```

#### Signup Page (`app/signup/page.tsx`)

- Same layout as login
- Uses `SignupForm`

#### Forgot Password Page (`app/forgot-password/page.tsx`)

- Uses `ForgotPasswordForm`
- Returns confirmation message after submit

#### Reset Password Page (`app/reset-password/page.tsx`)

```typescript
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

**Key Detail**: `Suspense` wrapper required because `ResetPasswordForm` uses `useSearchParams()` to extract reset token from URL.

#### Dashboard Page (`app/dashboard/page.tsx`)

```typescript
export default function DashboardPage() {
  return <RequireAuth><DashboardView /></RequireAuth>;
}
```

**Protection**: `RequireAuth` wrapper enforces authentication before rendering. Redirects to `/login` if not authenticated.

## Components Organization

### Component Directory Structure

```
components/
└── theme-provider.tsx            # ThemeProvider context

features/
├── auth/
│   ├── auth-shell.tsx            # Card layout wrapper
│   ├── login-form.tsx            # @LoginForm component
│   ├── signup-form.tsx           # @SignupForm component
│   ├── forgot-password-form.tsx  # @ForgotPasswordForm component
│   ├── reset-password-form.tsx   # @ResetPasswordForm component
│   ├── oauth-buttons.tsx         # Google/GitHub buttons
│   └── require-auth.tsx          # Authentication guard
└── dashboard/
    └── dashboard-view.tsx        # Dashboard UI
```

### Auth Components

#### AuthShell (`features/auth/auth-shell.tsx`)

Layout wrapper for all auth forms:

```typescript
interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  );
}
```

**Uses**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` from `@workspace/ui-core`

#### LoginForm (`features/auth/login-form.tsx`)

```typescript
'use client'; // Required for hooks

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@workspace/auth-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const router = useRouter();
  const { login, status } = useAuthStore();
  const [rootError, setRootError] = useState('');

  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (status === AuthStatus.AUTHENTICATED) {
      router.push('/dashboard');
    }
  }, [status, router]);

  async function onSubmit(data) {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof AuthApiError) {
        setRootError(error.message);
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* password field */}
      {rootError && <div className="text-destructive">{rootError}</div>}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
      <OAuthButtons />
    </form>
  );
}
```

**Pattern**:

- `'use client'` directive (Client Component)
- `useAuthStore()` from `@workspace/auth-client`
- `useForm()` from `react-hook-form` with Zod resolver
- Error handling: catches `AuthApiError`
- Auto-redirect if already authenticated
- Loading state via `form.formState.isSubmitting`

#### SignupForm (`features/auth/signup-form.tsx`)

Similar to LoginForm, with additional name field:

```typescript
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

async function onSubmit(data) {
  const trimmedName = data.name?.trim() || undefined;
  await authStore.signup(data.email, data.password, trimmedName);
  router.push('/dashboard');
}
```

**Key Detail**: Trims name to empty string if provided, passes `undefined` otherwise.

#### ForgotPasswordForm (`features/auth/forgot-password-form.tsx`)

```typescript
export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [rootError, setRootError] = useState('');
  const form = useForm({
    resolver: zodResolver(z.object({ email: z.string().email() })),
  });

  async function onSubmit(data) {
    try {
      await useAuthStore().forgotPassword(data.email);
      setDone(true); // Show confirmation, no email verification (security: don't leak email existence)
    } catch (error) {
      setRootError(error.message);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If an account with that email exists, you'll receive a password reset link.
        </p>
        <Button onClick={() => router.push('/login')}>Back to Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* email field */}
      <Button type="submit">Send Reset Link</Button>
    </form>
  );
}
```

**Security Pattern**: Always shows success message, even if email not found (doesn't leak email existence).

#### ResetPasswordForm (`features/auth/reset-password-form.tsx`)

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [rootError, setRootError] = useState('');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })
    ),
  });

  async function onSubmit(data) {
    try {
      await useAuthStore().resetPassword(
        decodeURIComponent(token || ''),
        data.password
      );
      router.push('/login');
    } catch (error) {
      setRootError(error.message);
    }
  }

  if (!token) {
    return <div className="text-destructive">Reset token is missing</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* password fields */}
      <Button type="submit" disabled={!token}>
        Reset Password
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
```

**Key Details**:

- Wrapped in `Suspense` (required for `useSearchParams()`)
- Extracts token from URL: `?token=...`
- **Important**: `decodeURIComponent()` applied to token before API call (URL-encoded format)
- Password confirmation client-side validation
- Disabled submit button if token missing
- Redirects to `/login` on success

#### OAuthButtons (`features/auth/oauth-buttons.tsx`)

```typescript
'use client';

import { getPublicAuthEnv } from '@workspace/auth-client';
import { oauthStartUrl } from '@workspace/auth-client';

export function OAuthButtons() {
  const { googleEnabled, githubEnabled, apiBaseUrl } = getPublicAuthEnv();

  if (!googleEnabled && !githubEnabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      {googleEnabled && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = oauthStartUrl(apiBaseUrl, 'google');
          }}
        >
          Sign in with Google
        </Button>
      )}
      {githubEnabled && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = oauthStartUrl(apiBaseUrl, 'github');
          }}
        >
          Sign in with GitHub
        </Button>
      )}
    </div>
  );
}
```

**Pattern**: Conditionally shows based on environment flags. Uses `window.location.href` for OAuth redirect.

#### RequireAuth (`features/auth/require-auth.tsx`)

```typescript
'use client';

import { useAuthStore } from '@workspace/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate(); // Attempts to refresh JWT via /auth/refresh (with cookie)
  }, []);

  if (status === AuthStatus.UNAUTHENTICATED) {
    router.push('/login');
    return null;
  }

  if (status === AuthStatus.IDLE || status === AuthStatus.LOADING) {
    return <div>Loading session…</div>;
  }

  if (status !== AuthStatus.AUTHENTICATED) {
    return null;
  }

  return children;
}
```

**Flow**:

1. On mount, calls `hydrate()` (attempts refresh token validation)
2. While loading, shows "Loading session…"
3. If unauthenticated, redirects to `/login`
4. If authenticated, renders children

#### DashboardView (`features/dashboard/dashboard-view.tsx`)

```typescript
'use client';

import { useAuthStore } from '@workspace/auth-client';
import { useRouter } from 'next/navigation';

export function DashboardView() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user?.email}</p>
      <Button onClick={handleLogout}>Log out</Button>
      <p className="text-sm text-muted-foreground">
        Replace this with your SaaS features: billing, settings, etc.
      </p>
    </div>
  );
}
```

**Usage**: Only rendered when `RequireAuth` confirms authentication.

### Theme Provider (`components/theme-provider.tsx`)

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    setTheme(stored || 'system');
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    let effectiveTheme = theme;

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    html.classList.toggle('dark', effectiveTheme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

**Features**:

- Persists theme choice to localStorage
- Matches system preference for `'system'` theme
- Toggles `dark` class on `<html>` element
- Hydration-safe (checks `mounted` flag)

## Form Architecture

### React Hook Form + Zod Validation

All forms use the same pattern:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate on blur (can be 'onChange', 'onBlur', 'onSubmit')
});

// In JSX:
<FormField
  control={form.control}
  name="field"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
    </FormItem>
  )}
/>
```

**From `@workspace/ui-core`**:

- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Input`, `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`

## Auth Client Integration

### useAuthStore Hook

```typescript
const {
  user,                    // Current user: { id, email, name }
  status,                  // AuthStatus enum
  register,                // (email, password, name?) → Promise
  login,                   // (email, password) → Promise
  logout,                  // () → Promise
  hydrate,                 // () → Promise (refresh JWT)
  forgotPassword,          // (email) → Promise
  resetPassword,           // (token, password) → Promise
} = useAuthStore();
```

**From `packages/auth-client`**: Manages JWT in memory, refresh token in HttpOnly cookie, auth state globally.

### AuthApiError

Thrown by auth-client methods:

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error instanceof AuthApiError) {
    console.log(error.status);      // HTTP status
    console.log(error.message);     // User-friendly message
    console.log(error.body);        // Raw response
  }
}
```

## Styling with Tailwind CSS

**Version**: Tailwind CSS 4.1.18

**Configuration**:

- PostCSS integration
- Dark mode support (class-based)
- Responsive utilities: `sm:`, `md:`, `lg:`, `xl:`
- Custom colors from shadcn/ui

**Global Styles**: `app/globals.css`

**Common Patterns**:

```typescript
// Flexbox layout
<div className="flex min-h-svh flex-col items-center justify-center">

// Responsive grid
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<div className="p-4 mb-6 gap-2">

// Colors
<p className="text-muted-foreground">
<button className="text-destructive">

// Responsive text
<h1 className="text-2xl sm:text-3xl md:text-4xl">
```

**Dark Mode**: Applied via `dark` class on `<html>` element. Tailwind utilities automatically switch colors (e.g., `bg-white` → `dark:bg-slate-950`).

## Environment Configuration

**File**: `next.config.ts` transpiles `@workspace/auth-client` which handles env loading.

**Environment Variables** (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3009
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=false
```

**Access in Components**:

```typescript
import { getPublicAuthEnv } from '@workspace/auth-client';

const { apiBaseUrl, googleEnabled, githubEnabled } = getPublicAuthEnv();
```

**Dual Build Support** (in `@workspace/auth-client`):

- Next.js: `process.env.NEXT_PUBLIC_*`
- Vite: `import.meta.env.VITE_*`

## Build & Development

**Scripts** (`package.json`):

```bash
bun run dev          # Start dev server (port 3001, hot reload)
bun run build        # Build for production (outputs .next/)
bun run start        # Run production build
bun run lint         # ESLint check
bun run format       # Prettier format
bun run typecheck    # TypeScript check (no emit)
```

**Build Output**:

- `.next/` directory (gitignored)
- Next.js handles code-splitting, optimization
- Environment variables baked into build (NEXT*PUBLIC*\* only)

## Dependencies & Versions

**Production**:

- `next`: 16.2.6
- `react`: 19.2.4
- `react-dom`: 19.2.4
- `react-hook-form`: 7.71.1 (form state management)
- `zod`: 3.25.76 (schema validation)
- `@hookform/resolvers`: 5.2.2 (Zod integration)
- `@workspace/auth-client`: workspace:\* (local package)
- `@workspace/ui-core`: workspace:\* (local package)

**DevDependencies**:

- `typescript`: 5.9.3
- `eslint`: (via shared config)
- `prettier`: (via root)
- `tailwindcss`: 4.1.18
- `@tailwindcss/postcss`: Latest
- React types, Node types

## Common Development Workflows

### Adding a New Auth Page

1. **Create page directory**: `app/new-feature/page.tsx`
2. **Create feature form**: `features/auth/new-feature-form.tsx`
   - Use `'use client'` directive
   - Import `useAuthStore()`, `useForm()`, Zod
   - Handle errors as `AuthApiError`
   - Call `authStore.newFeature()`
3. **Use `AuthShell` wrapper** for consistent layout
4. **Export from page**:
   ```typescript
   import { NewFeatureForm } from '@/features/auth/new-feature-form';
   export default function NewFeaturePage() {
     return <AuthShell title="..."><NewFeatureForm /></AuthShell>;
   }
   ```
5. **Add to navigation** (home page links)
6. **Ensure backend endpoint exists** (from nestjs-api SKILLS)

### Adding a Protected Route

1. **Create page**: `app/feature/page.tsx`
2. **Wrap content in `RequireAuth`**:

   ```typescript
   import { RequireAuth } from '@/features/auth/require-auth';
   import { FeatureView } from '@/features/feature/feature-view';

   export default function FeaturePage() {
     return <RequireAuth><FeatureView /></RequireAuth>;
   }
   ```

3. **Access user data in component**:
   ```typescript
   'use client';
   const { user } = useAuthStore();
   return <div>Hello, {user?.email}</div>;
   ```

### Modifying Form Validation

1. **Update Zod schema**:
   ```typescript
   const schema = z.object({
     field: z.string().min(5, 'At least 5 characters'),
   });
   ```
2. **Error message automatically displayed** via `<FormMessage />`
3. **Test in browser**: Form validation shows immediately on blur/submit

### Handling API Errors Globally

Option 1: Wrap API call with try/catch in each form:

```typescript
try {
  await authStore.login(email, password);
} catch (error) {
  if (error instanceof AuthApiError) {
    setError(error.message);
  }
}
```

Option 2: Add middleware to `useAuthStore()` methods (advanced):

- Modify `packages/auth-client/src/store.ts` to intercept all API calls
- Add global error handling, retry logic, logging

## Gotchas & Anti-patterns

❌ **Don't**:

- Store JWT in localStorage (XSS vulnerability)
- Hardcode API URLs in components (use env vars via `@workspace/auth-client`)
- Forget `'use client'` on components using hooks
- Use `client` forms without proper error handling
- Forget `credentials: "include"` when calling `/auth/refresh` (it's in auth-client, but important to know)
- Skip `Suspense` wrapper around components using `useSearchParams()`
- Use `useEffect` for data fetching on mount without cleanup
- Forget to test OAuth redirect flow in staging

✅ **Do**:

- Use `useAuthStore()` for all auth state (single source of truth)
- Handle `AuthApiError` explicitly in forms
- Show loading states during API calls
- Use `RequireAuth` wrapper on protected pages
- Keep auth forms DRY (use `AuthShell` layout)
- Test password validation schemas thoroughly
- Use `decodeURIComponent()` for URL-encoded tokens from query params
- Store user preferences (theme, locale) in localStorage (safe)
- Redirect to `/login` on 401 errors

## File Structure

```
apps/nextjs-app/
├── app/
│   ├── layout.tsx                # Root layout with ThemeProvider
│   ├── globals.css               # Global Tailwind styles
│   ├── page.tsx                  # Home page
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── dashboard/page.tsx
├── features/
│   ├── auth/
│   │   ├── auth-shell.tsx
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── reset-password-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── require-auth.tsx
│   └── dashboard/
│       └── dashboard-view.tsx
├── components/
│   └── theme-provider.tsx
├── .next/                        # Build output (gitignore)
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json               # shadcn/ui config
├── package.json
└── README.md
```

## When to Update This Skills File

Agents should update this file after:

- ✅ Adding new pages or routes
- ✅ Adding new form components
- ✅ Changing auth flow on frontend (new steps, new validation)
- ✅ Updating styling approach (new Tailwind utilities, colors)
- ✅ Changing component architecture pattern
- ❌ NOT for: Fixing styling, adjusting form field labels, bug fixes

---

## See Also

- [packages/auth-client/SKILLS.md](../../packages/auth-client/SKILLS.md) — API client contract
- [INTEGRATION-GUIDE.md](../../INTEGRATION-GUIDE.md) — Full auth flow with examples
- [docs/AI_AGENT_UPDATES.md](../../docs/AI_AGENT_UPDATES.md) — How to update SKILLS files

## Recently Added by AI Agents

(Updated by agents when making changes)

- **2026-05-18**: Initial comprehensive skills documentation created
