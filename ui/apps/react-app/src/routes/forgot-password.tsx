import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from '../components/Auth/forgotPassword.form'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <ForgotPasswordForm />
    </main>
  )
}
