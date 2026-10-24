# Vercel deployment

Deploy this repository as the existing `coms-app` project with the Next.js
framework preset and Node.js 24.x. Functions run in Sydney beside coms-api
and its Supabase database.

Configure these server-only variables for **Production** in Vercel:

| Variable                   | Value                                            |
| -------------------------- | ------------------------------------------------ |
| `NODE_ENV`                 | `production`                                     |
| `COMS_API_BASE_URL`        | `https://coms-api.vercel.app`                    |
| `COMS_AUTH_GATEWAY_SECRET` | The same generated secret configured on coms-api |

Never use `NEXT_PUBLIC_` for the gateway secret. Local environment files are
not deployed; localhost URLs cannot reach the API from a Vercel function.
The API's `WEB_ORIGIN` must match the canonical frontend origin exactly:
`https://coms-app-sigma.vercel.app`. Sign in using that domain.

Deploy the configured API first, then the frontend. Verify sign-in, a
protected page and cookie refresh after deployment. The API needs an
initialized COMS database; an empty Supabase project cannot authenticate users.
Preview deployments require separately configured database/API access and
secrets. Do not share the production database automatically with previews.
