import type { Metadata } from "next"

import "@workspace/ui-core/globals.css"

import { ThemeProvider } from "@/ui-core/themeProvider"

export const metadata: Metadata = {
  title: "SaaS Starter",
  description: "Next.js app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
