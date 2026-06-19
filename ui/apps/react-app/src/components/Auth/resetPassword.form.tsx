"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { z } from "zod"

import { AuthApiError, useAuthStore } from "@workspace/auth-client"
import { Button } from "@workspace/ui-core"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui-core"
import { Input } from "@workspace/ui-core"

import { AuthShell } from "./authShell"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./authForms.schema"

function ResetPasswordFields() {
  const searchParams = useSearch({ strict: false }) as Record<string, string>
  const navigate = useNavigate()
  const { resetPassword } = useAuthStore()
  const token = useMemo(() => searchParams.token ?? "", [searchParams])
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setRootError(null)
    if (values.password !== values.confirm) {
      setRootError("Passwords do not match")
      return
    }
    if (!token) {
      setRootError("Missing reset token in URL")
      return
    }
    try {
      await resetPassword(decodeURIComponent(token), values.password)
      void navigate({ to: "/login", replace: true })
    } catch (e) {
      if (e instanceof AuthApiError) {
        setRootError(e.message)
        return
      }
      setRootError("Something went wrong")
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Choose a new password for your account."
      footer={
        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          to="/login"
        >
          Back to log in
        </Link>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {rootError ? (
            <p className="text-sm text-destructive" role="alert">
              {rootError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !token}
          >
            {form.formState.isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  )
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordFields />
    </Suspense>
  )
}
