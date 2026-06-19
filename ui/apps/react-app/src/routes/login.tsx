import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../components/Auth/login.form'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <LoginForm />
    </main>
  )
}
