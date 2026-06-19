import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordForm } from '../components/Auth/resetPassword.form'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <ResetPasswordForm />
    </main>
  )
}
