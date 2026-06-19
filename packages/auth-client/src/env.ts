import type { PublicAuthEnv } from "./types.ts"

function readNextPublicApiUrl(): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined
  }
  return process.env.NEXT_PUBLIC_API_URL
}

function readViteApiUrl(): string | undefined {
  try {
    const env = import.meta as ImportMeta & {
      env?: { VITE_API_URL?: string }
    }
    return env.env?.VITE_API_URL
  } catch {
    return undefined
  }
}

function readBool(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value === "") {
    return defaultValue
  }
  return value === "1" || value.toLowerCase() === "true" || value === "yes"
}

function readNextGoogle(): boolean {
  if (typeof process === "undefined" || !process.env) {
    return false
  }
  return readBool(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED)
}

function readNextGithub(): boolean {
  if (typeof process === "undefined" || !process.env) {
    return false
  }
  return readBool(process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED)
}

function readViteGoogle(): boolean {
  try {
    const env = import.meta as ImportMeta & {
      env?: { VITE_AUTH_GOOGLE_ENABLED?: string }
    }
    return readBool(env.env?.VITE_AUTH_GOOGLE_ENABLED)
  } catch {
    return false
  }
}

function readViteGithub(): boolean {
  try {
    const env = import.meta as ImportMeta & {
      env?: { VITE_AUTH_GITHUB_ENABLED?: string }
    }
    return readBool(env.env?.VITE_AUTH_GITHUB_ENABLED)
  } catch {
    return false
  }
}

/** Resolve public auth-related env for client bundles (Next or Vite). */
export function getPublicAuthEnv(): PublicAuthEnv {
  const apiBaseUrl =
    readNextPublicApiUrl() ?? readViteApiUrl() ?? "http://localhost:3000"

  const googleEnabled = readNextGoogle() || readViteGoogle()
  const githubEnabled = readNextGithub() || readViteGithub()

  return { apiBaseUrl, googleEnabled, githubEnabled }
}
