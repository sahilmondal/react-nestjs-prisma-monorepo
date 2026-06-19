import { Button } from "@workspace/ui-core"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-medium">Next.js app</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          SaaS starter on the App Router. Use auth routes to sign in or create
          an account.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
