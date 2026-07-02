---
title: ESLint Config - Shared Linting Rules
version: 1.0.0
lastUpdated: 2026-05-18
toolsSupported: [copilot, claude-code, gemini, antigravity, opencode, codex]
tags: [eslint, config, linting, typescript, react]
---

# ESLint Config - Shared Linting Rules

Shared ESLint configurations for consistent code quality across all apps and packages. Provides base, Next.js, and React-specific rule sets.

**Location**: `packages/eslint-config/`  
**Package Manager**: Bun

## Configuration Files

### 1. Base ESLint Config (`base.js`)

Baseline rules for TypeScript projects:

```javascript
module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-types": "off", // Too strict
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
}
```

**Includes**:

- ESLint recommended rules
- TypeScript-specific rules
- Unused variable detection (ignore prefixed with `_`)
- Console warnings (allow warn/error, forbid log/info)

**Usage** (for backend, CLI tools):

```json
{
  "extends": ["@workspace/eslint-config/base"]
}
```

### 2. React Internal Config (`react-internal.js`)

Extended config for React libraries (with `@workspace/ui-core`):

```javascript
module.exports = {
  extends: ["./base"],
  env: {
    browser: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    sourceType: "module",
  },
  plugins: ["react", "react-hooks"],
  rules: {
    "react/react-in-jsx-scope": "off", // React 18+
    "react/prop-types": "off", // Use TypeScript
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
}
```

**Includes**:

- Base rules + React-specific
- React Hooks plugin enforcement
- JSX support
- React 18+ (no `React` import needed)

**Usage** (for `packages/ui`):

```json
{
  "extends": ["@workspace/eslint-config/react-internal"]
}
```

### 3. Next.js Config (`next.js`)

Extended config for Next.js apps:

```javascript
module.exports = {
  extends: ["./react-internal", "next"],
  rules: {
    "react/no-unescaped-entities": "warn",
    "@next/next/no-html-link-for-pages": "off",
  },
}
```

**Includes**:

- React Internal rules + Next.js-specific
- Next.js best practices (image optimization, link usage, etc.)
- Image component validation

**Usage** (for `apps/nextjs-app`):

```json
{
  "extends": ["@workspace/eslint-config/next"]
}
```

## Rule Categories

### TypeScript Rules

| Rule                                                | Level | Purpose                                  |
| --------------------------------------------------- | ----- | ---------------------------------------- |
| `@typescript-eslint/no-unused-vars`                 | error | Catch unused variables, allow `_` prefix |
| `@typescript-eslint/no-explicit-any`                | warn  | Discourage `any` type (migration aid)    |
| `@typescript-eslint/explicit-function-return-types` | off   | Too strict for rapid development         |

### React Rules

| Rule                          | Level | Purpose                                   |
| ----------------------------- | ----- | ----------------------------------------- |
| `react/react-in-jsx-scope`    | off   | React 18+ (no import needed)              |
| `react/prop-types`            | off   | Use TypeScript instead                    |
| `react-hooks/rules-of-hooks`  | error | Enforce hook rules (no conditional hooks) |
| `react-hooks/exhaustive-deps` | warn  | Warn on missing dependencies              |

### Next.js Rules

| Rule                                | Level | Purpose                           |
| ----------------------------------- | ----- | --------------------------------- |
| `@next/next/no-html-link-for-pages` | off   | Allow `<a>` tags in some contexts |

### General Rules

| Rule         | Level | Purpose                                      |
| ------------ | ----- | -------------------------------------------- |
| `no-console` | warn  | Catch leftover debug logs (allow warn/error) |

## Usage in Projects

### Backend (NestJS API)

**File**: `apps/http-api/.eslintrc.json`

```json
{
  "extends": ["@workspace/eslint-config/base"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "no-console": "off" // Allow logs in backend
  }
}
```

### Frontend (Next.js App)

**File**: `apps/nextjs-app/eslint.config.mjs`

```javascript
import nextConfig from "@workspace/eslint-config/next"

export default [
  {
    ignores: [".next", "dist"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: "@typescript-eslint/parser",
    },
    ...nextConfig,
  },
]
```

### UI Library

**File**: `packages/ui/eslint.config.js`

```javascript
module.exports = {
  extends: ["@workspace/eslint-config/react-internal"],
}
```

## Running ESLint

### From Workspace Root

```bash
bun run lint          # Lint all packages
bun run lint -- --fix # Auto-fix issues
```

### Per Package

```bash
cd apps/http-api
bun run lint
bun run lint -- --fix
```

### CI/CD

ESLint should run on:

- Pre-commit hook (via husky, if configured)
- CI pipeline (before merge)
- Development: Auto-run with IDE extensions

## IDE Integration

### VS Code

Install "ESLint" extension (dbaeumer.vscode-eslint):

```json
// .vscode/settings.json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**Result**: Linting errors highlighted in editor, auto-fix on save.

## Common Rules Explained

### Unused Variables (`no-unused-vars`)

```typescript
// ❌ Error
const userId = getUserId();
console.log("User loaded"); // userId not used

// ✅ OK
const userId = getUserId();
const _unused = getUserId(); // Prefixed with _ (intentionally unused)

// ✅ OK
const { id: _id, ...rest } = user; // Destructuring with _
```

### React Hooks (`exhaustive-deps`)

```typescript
// ❌ Warning: missing dependency
useEffect(() => {
  console.log(userId); // userId used but not in deps
}, []); // Should include userId

// ✅ OK
useEffect(() => {
  console.log(userId);
}, [userId]);

// ✅ OK (intentional, with comment)
useEffect(() => {
  console.log(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Run once on mount
```

### Console Usage

```typescript
// ❌ Error (in frontend dev)
console.log("Debug"); // Will be caught in production
console.log("Debug"); // Can expose sensitive data

// ✅ OK
console.warn("Warning!");
console.error("Error occurred");

// ✅ OK (in backend)
console.log("Server started"); // Backend allows logs
```

## Dependencies & Versions

**Production**:

- `@typescript-eslint/eslint-plugin`: Latest
- `@typescript-eslint/parser`: Latest
- `eslint-plugin-react`: Latest
- `eslint-plugin-react-hooks`: Latest
- `@next/eslint-plugin-next`: Latest

**DevDependencies**:

- `eslint`: Latest
- TypeScript

## Customizing ESLint Rules

### For a Specific Project

Override in app's `.eslintrc.json`:

```json
{
  "extends": ["@workspace/eslint-config/next"],
  "rules": {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### For All Projects

Modify `packages/eslint-config/{config}.js` and version bump.

## Common Issues & Solutions

### Issue: "Cannot find module '@typescript-eslint/parser'"

**Solution**: Install dependencies:

```bash
bun install
cd packages/eslint-config
bun install
```

### Issue: ESLint showing old errors after config change

**Solution**: Clear cache and restart ESLint:

```bash
bun run lint -- --fix
# Restart IDE ESLint server: Cmd+Shift+P "ESLint: Restart ESLint Server"
```

### Issue: TypeScript errors not caught by ESLint

**Solution**: Ensure `parserOptions.project` points to correct `tsconfig.json`:

```json
{
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

## File Structure

```
packages/eslint-config/
├── base.js                  # Base rules (TypeScript)
├── react-internal.js        # React library rules
├── next.js                  # Next.js app rules
├── package.json
└── README.md
```

## When to Update This Skills File

Agents should update this file after:

- ✅ Adding new ESLint rules or plugins
- ✅ Creating new config variant (e.g., testing.js)
- ✅ Changing rule severity (error → warn, etc.)
- ✅ Updating linting philosophy
- ❌ NOT for: Running lint, fixing code, one-off rule overrides

---

## See Also

- [packages/typescript-config/SKILLS.md](../typescript-config/SKILLS.md) — TypeScript configuration
- [docs/AI_AGENT_UPDATES.md](../../docs/AI_AGENT_UPDATES.md) — How to update SKILLS

## Recently Added by AI Agents

(Updated by agents when making changes)

- **2026-05-18**: Initial comprehensive skills documentation created
