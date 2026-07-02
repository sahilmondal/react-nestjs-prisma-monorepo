import { z } from "zod"

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/

const emailSchema = z
  .string()
  .nonempty({ message: "Email is required." })
  .email({ message: "Please provide a valid email address." })

const passwordSchema = z
  .string()
  .nonempty({ message: "Password is required." })
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(128, { message: "Password must be at most 128 characters long." })
  .regex(passwordRegex, {
    message:
      "Password must include at least one lowercase letter, one uppercase letter, one number and one special character.",
  })
const nameSchema = z
  .string()
  .trim()
  .nonempty({ message: "Name is required." })
  .min(2, { message: "Name must be at least 2 characters long." })
  .max(100, { message: "Name must be 100 characters or fewer." })

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
})

export type SignupFormValues = z.infer<typeof signupSchema>

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm: passwordSchema,
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
