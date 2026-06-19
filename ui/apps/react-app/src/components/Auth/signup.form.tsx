"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { AuthApiError, AuthStatus, useAuthStore } from "@workspace/auth-client"
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from "@workspace/ui-core"
import { AuthShell } from "./authShell"
import { OAuthButtons } from "./oauthButtons"
import { signupSchema, type SignupFormValues } from "./authForms.schema"

export function SignupForm() {
  const navigate = useNavigate()
  const { register: registerUser, status } = useAuthStore()
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", name: "" },
  })

  useEffect(() => {
    if (status === AuthStatus.AUTHENTICATED) {
      void navigate({ to: "/dashboard", replace: true })
    }
  }, [navigate, status])

  async function onSubmit(values: SignupFormValues) {
    setRootError(null)
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        name: values.name?.trim(),
      })
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
      title="Create account"
      description="Start with email and password."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-primary underline-offset-4 hover:underline"
            to="/login"
          >
            Log in
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      </Form>
      <div className="flex flex-col gap-4">
        <Separator />
        <OAuthButtons />
      </div>
    </AuthShell>
  )
}
