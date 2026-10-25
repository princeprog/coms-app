# Vercel deployment

Deploy this repository as the existing `coms-app` project with the Next.js
framework preset and Node.js 24.x. Functions run in Sydney beside coms-api
and its Supabase database.

`vercel.json` installs and builds with pnpm 11.8.0, the version that wrote the
lockfile. Vercel otherwise picks pnpm 9 or 10 from the lockfile format; those
reject the patched `sileo` dependency declared in `pnpm-workspace.yaml`
(`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`) and the deployment fails during install.
Keep `packageManager`, `vercel.json` and the local pnpm version in step. The
build also generates `public/sw.js` and the offline shell after `next build`.

Configure these server-only variables for **Production** in Vercel:

| Variable                   | Value                                            |
| -------------------------- | ------------------------------------------------ |
| `NODE_ENV`                 | `production`                                     |
| `COMS_API_BASE_URL`        | `https://coms-api.vercel.app`                    |
| `COMS_AUTH_GATEWAY_SECRET` | The same generated secret configured on coms-api |

Never use `NEXT_PUBLIC_` for the gateway secret. Local environment files are
not deployed; localhost URLs cannot reach the API from a Vercel function.
The API's `WEB_ORIGIN` must match the canonical frontend origin exactly:
`https://coms-emmaschickenhouse.vercel.app`. Sign in using that domain.

The former `coms-app-sigma.vercel.app` address redirects permanently to this
domain, preserving the requested path and query string.

Deploy the configured API first, then the frontend. Verify sign-in, a
protected page and cookie refresh after deployment. The API needs an
initialized COMS database; an empty Supabase project cannot authenticate users.
Preview deployments require separately configured database/API access and
secrets. Do not share the production database automatically with previews.
