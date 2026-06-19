# Auth Client

A framework-agnostic authentication client library that provides API request wrappers for authentication flows.

## Environment Variables

To use this client in different frontend frameworks, you need to configure the following environment variables:

### For Next.js Apps
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=true
```

### For Vite Apps
```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_GOOGLE_ENABLED=true
VITE_AUTH_GITHUB_ENABLED=true
```

## API Reference

The following functions are exported and require `baseUrl` as the first argument:
- `registerRequest(baseUrl, body)`
- `loginRequest(baseUrl, body)`
- `refreshRequest(baseUrl)`
- `logoutRequest(baseUrl)`
- `meRequest(baseUrl, accessToken)`
- `forgotPasswordRequest(baseUrl, body)`
- `resetPasswordRequest(baseUrl, body)`
- `oauthStartUrl(baseUrl, provider)`
