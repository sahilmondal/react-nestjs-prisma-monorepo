"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "@tanstack/react-router"
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

const schema = z.object({
  email: z.string().email(),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuthStore()
  const [done, setDone] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: FormValues) {
    setRootError(null)
    try {
      await forgotPassword(values.email)
      setDone(true)
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
      title="Forgot password"
      description="We will email a reset link if the address exists."
      footer={
        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          to="/login"
        >
          Back to log in
        </Link>
      }
    >
      {done ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, check your inbox for reset
          instructions.
        </p>
      ) : (
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
            {rootError ? (
              <p className="text-sm text-destructive" role="alert">
                {rootError}
              </p>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  )
}
