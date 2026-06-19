"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@workspace/auth-client"
import { Button } from "@workspace/ui-core"

export function DashboardView() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void logout().then(() => router.replace("/login"))
          }}
        >
          Log out
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This is a placeholder dashboard. Replace it with your SaaS home,
        billing, and settings routes.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  )
}
