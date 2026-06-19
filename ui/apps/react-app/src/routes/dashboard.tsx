import { Link, useNavigate, createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@workspace/auth-client'
import { RequireAuth } from '../components/Auth/requireAuth'
import { Button } from '@workspace/ui-core'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <RequireAuth>
      <main className="page-wrap flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
        <DashboardView />
      </main>
    </RequireAuth>
  )
}

function DashboardView() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="island-shell w-full max-w-lg flex flex-col gap-6 p-6 sm:p-8 rounded-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display-title text-xl font-bold text-[var(--sea-ink)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--sea-ink-soft)] mt-1">
            Signed in as {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void logout().then(() => navigate({ to: '/login', replace: true }))
          }}
        >
          Log out
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">
        This is a placeholder dashboard. Replace it with your SaaS home,
        billing, and settings routes.
      </p>
      <Button variant="secondary" asChild>
        <Link to="/">Home</Link>
      </Button>
    </div>
  )
}
