"use client"

import { Button } from "@workspace/ui-core"
import { getPublicAuthEnv, oauthStartUrl } from "@workspace/auth-client"

export function OAuthButtons() {
  const { apiBaseUrl, googleEnabled, githubEnabled } = getPublicAuthEnv()

  if (!googleEnabled && !githubEnabled) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs text-muted-foreground">
        Or continue with
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        {googleEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              window.location.href = oauthStartUrl(apiBaseUrl, "google")
            }}
          >
            Google
          </Button>
        ) : null}
        {githubEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              window.location.href = oauthStartUrl(apiBaseUrl, "github")
            }}
          >
            GitHub
          </Button>
        ) : null}
      </div>
    </div>
  )
}
