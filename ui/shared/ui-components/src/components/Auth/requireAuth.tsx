"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthStatus, useAuthStore } from "@workspace/auth-client"

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, hydrate } = useAuthStore()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (status === AuthStatus.UNAUTHENTICATED) {
      router.replace("/login")
    }
  }, [router, status])

  if (status === AuthStatus.IDLE || status === AuthStatus.LOADING) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading session…
      </div>
    )
  }

  if (status !== AuthStatus.AUTHENTICATED) {
    return null
  }

  return <>{children}</>
}
