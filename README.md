# COMS frontend

## Local authentication setup

Run the NestJS API on port `3001` and the Next.js app on port `3000`:

```powershell
# Terminal 1: coms-api
$env:PORT = "3001"
$env:WEB_ORIGIN = "http://localhost:3000"
pnpm start:dev

# Terminal 2: coms-app
Copy-Item .env.example .env.local
pnpm dev
```

`COMS_API_BASE_URL` is server-only. TanStack auth hooks call server actions in
`features/auth/services/`, which call Nest and relay only the HttpOnly access
and refresh cookies. Tokens never enter JavaScript storage.
