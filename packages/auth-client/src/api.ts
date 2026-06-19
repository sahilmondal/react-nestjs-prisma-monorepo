import type { AuthTokensResponse, AuthUser } from "./types.ts"

export type ApiErrorBody = {
  statusCode: number
  message: string | string[]
  error?: string
}

export class AuthApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message)
    this.name = "AuthApiError"
    this.status = status
    this.body = body
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit & { method?: string }
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  const data = await parseJson(response)

  if (!response.ok) {
    const body = data as ApiErrorBody | null
    const message =
      typeof body?.message === "string"
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(", ")
          : response.statusText
    throw new AuthApiError(response.status, message, body)
  }

  return data as T
}

export async function registerRequest(
  baseUrl: string,
  body: { email: string; password: string; name?: string }
): Promise<AuthTokensResponse> {
  return requestJson<AuthTokensResponse>(baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function loginRequest(
  baseUrl: string,
  body: { email: string; password: string }
): Promise<AuthTokensResponse> {
  return requestJson<AuthTokensResponse>(baseUrl, "/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function refreshRequest(
  baseUrl: string
): Promise<AuthTokensResponse> {
  return requestJson<AuthTokensResponse>(baseUrl, "/auth/refresh", {
    method: "POST",
  })
}

export async function logoutRequest(baseUrl: string): Promise<void> {
  await requestJson<unknown>(baseUrl, "/auth/logout", {
    method: "POST",
  })
}

export async function meRequest(
  baseUrl: string,
  accessToken: string
): Promise<{ user: AuthUser }> {
  return requestJson<{ user: AuthUser }>(baseUrl, "/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function forgotPasswordRequest(
  baseUrl: string,
  body: { email: string }
): Promise<void> {
  await requestJson<unknown>(baseUrl, "/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function resetPasswordRequest(
  baseUrl: string,
  body: { token: string; password: string }
): Promise<void> {
  await requestJson<unknown>(baseUrl, "/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function oauthStartUrl(
  baseUrl: string,
  provider: "google" | "github"
): string {
  const root = baseUrl.replace(/\/$/, "")
  return `${root}/auth/${provider}`
}
