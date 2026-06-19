import { create } from "zustand"

import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  resetPasswordRequest,
} from "./api.ts"
import { getPublicAuthEnv } from "./env.ts"
import { AuthStatus, type AuthState } from "./types.ts"

function baseUrl() {
  return getPublicAuthEnv().apiBaseUrl
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: AuthStatus.IDLE,

  setSession: (user, accessToken) => {
    set({ user, accessToken, status: AuthStatus.AUTHENTICATED })
  },

  clearSession: () => {
    set({ user: null, accessToken: null, status: AuthStatus.UNAUTHENTICATED })
  },

  hydrate: async () => {
    const { accessToken, status } = get()
    if (status === AuthStatus.LOADING) {
      return
    }
    set({ status: AuthStatus.LOADING })
    try {
      if (accessToken) {
        set({ status: AuthStatus.AUTHENTICATED })
        return
      }
      const refreshed = await refreshRequest(baseUrl())
      set({
        user: refreshed.user,
        accessToken: refreshed.accessToken,
        status: AuthStatus.AUTHENTICATED,
      })
    } catch {
      set({ user: null, accessToken: null, status: AuthStatus.UNAUTHENTICATED })
    }
  },

  login: async (email, password) => {
    set({ status: AuthStatus.LOADING })
    const res = await loginRequest(baseUrl(), { email, password })
    set({
      user: res.user,
      accessToken: res.accessToken,
      status: AuthStatus.AUTHENTICATED,
    })
  },

  register: async (input) => {
    set({ status: AuthStatus.LOADING })
    const res = await registerRequest(baseUrl(), input)
    set({
      user: res.user,
      accessToken: res.accessToken,
      status: AuthStatus.AUTHENTICATED,
    })
  },

  logout: async () => {
    try {
      await logoutRequest(baseUrl())
    } finally {
      get().clearSession()
    }
  },

  forgotPassword: async (email) => {
    await forgotPasswordRequest(baseUrl(), { email })
  },

  resetPassword: async (token, password) => {
    await resetPasswordRequest(baseUrl(), { token, password })
  },
}))
