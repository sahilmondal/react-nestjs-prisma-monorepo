import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from '../components/Auth/signup.form'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <SignupForm />
    </main>
  )
}
