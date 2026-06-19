export type AuthUser = {
  id: string
  email: string
  name: string | null
  emailVerifiedAt: string | null
}

export type AuthTokensResponse = {
  accessToken: string
  user: AuthUser
}

export type PublicAuthEnv = {
  apiBaseUrl: string
  googleEnabled: boolean
  githubEnabled: boolean
}

export enum AuthStatus {
    IDLE = "IDLE",
    LOADING = "LOADING",
    AUTHENTICATED = "AUTHENTICATED",
    UNAUTHENTICATED = "UNAUTHENTICATED",
}

export type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  setSession: (user: AuthUser, accessToken: string) => void
  clearSession: () => void
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    name?: string
  }) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}