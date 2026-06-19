"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { AuthApiError, AuthStatus, useAuthStore } from "@workspace/auth-client"
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
import { Separator } from "@workspace/ui-core"

import { AuthShell } from "./authShell"
import { OAuthButtons } from "./oauthButtons"
import { loginSchema, type LoginFormValues } from "./authForms.schema"

export function LoginForm() {
  const navigate = useNavigate()
  const { login, status } = useAuthStore()
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (status === AuthStatus.AUTHENTICATED) {
      void navigate({ to: "/dashboard", replace: true })
    }
  }, [navigate, status])

  async function onSubmit(values: LoginFormValues) {
    setRootError(null)
    try {
      await login(values.email, values.password)
      void navigate({ to: "/dashboard", replace: true })
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
      title="Log in"
      description="Sign in to your account."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            className="text-primary underline-offset-4 hover:underline"
            to="/signup"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>
      <div className="flex justify-center text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground"
          to="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        <Separator />
        <OAuthButtons />
      </div>
    </AuthShell>
  )
}
