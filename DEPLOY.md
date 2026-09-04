# Deploy — GitHub + Turso + Vercel (all three apps)

Architecture in production:

| Piece      | Host   | Project / URL                                    |
| ---------- | ------ | ------------------------------------------------ |
| Code       | GitHub | `kjassi435/bakes-n-sale`, branch `main`          |
| Database   | Turso  | `bakes-n-sale-kjassi435.aws-ap-south-1.turso.io` (Mumbai) |
| Storefront | Vercel | `bakes-n-sale-storefront` → https://bakes-n-sale-storefront.vercel.app |
| Admin      | Vercel | `bakes-n-sale-admin` → https://bakes-n-sale-admin.vercel.app |
| API        | Vercel | `bakes-n-sale-api` → https://bakes-n-sale-api.vercel.app (NestJS on a serverless function via `apps/api/api/index.ts` + rewrites; same code as local `src/main.ts`) |

## 0. Prerequisites (install once)

```powershell
# Turso CLI (Windows)
powershell -c "irm https://get.tur.so/install.ps1 | iex"
# GitHub CLI (optional, else use github.com/new in the browser)
winget install GitHub.cli
```

## 1. GitHub — push the code

```powershell
cd C:\Users\kjass\Desktop\bakery
git init
git add .
git commit -m "Bakes n Sale — full e-commerce platform with admin CMS"
# create an empty repo on github.com/new (do NOT add README/license), then:
git remote add origin https://github.com/<you>/bakes-n-sale.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.env*`, `*.db`, logs and build output.
Product images under `apps/*/public/images` ARE committed (the site needs them).

## 2. Turso — create the database

```powershell
turso auth login            # browser login (or turso auth signup)
turso db create bakes-n-sale --region bom   # use nearest region (bom = Mumbai)
turso db show bakes-n-sale --url            # copy the libsql:// URL
turso auth token bakes-n-sale               # copy the token (auth token)
```

Apply the schema (generated from Prisma, committed at `apps/api/prisma/turso-schema.sql`):

```powershell
turso db shell bakes-n-sale < apps/api/prisma/turso-schema.sql
```

Seed catalog + users + coupons + site-content (run from your machine, pointing at Turso):

```powershell
cd apps/api
$env:DATABASE_URL="libsql://bakes-n-sale-<you>.turso.io"
$env:TURSO_AUTH_TOKEN="<token>"
npm run db:seed
```

Seeded logins: `admin@bakesnsale.com / Admin@123`, `manager@bakesnsale.com / Manager@123`, `priya@example.com / Priya@123`.

## 3. Vercel — API project (done via API/CLI)

Project `bakes-n-sale-api`, Root Directory `apps/api`. It builds with
`npm run build -w @bakery/shared && npm run build -w @bakery/api` (see `apps/api/vercel.json`)
and serves NestJS from the `api/` serverless function with rewrites `/api/(.*) → /api`.
Env (production): `DATABASE_URL` (libsql://…), `TURSO_AUTH_TOKEN`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `CORS_ORIGINS=https://bakes-n-sale-storefront.vercel.app,https://bakes-n-sale-admin.vercel.app`.
Health check: `https://bakes-n-sale-api.vercel.app/api/health` → `{"ok":true,…}`.

> Note: `render.yaml` is kept as a fallback if you ever want the API on Render instead.

## 4. Vercel — host storefront + admin (2 projects, 1 repo)

For **each** app (do it twice):

1. **vercel.com → Add New → Project → Import** the GitHub repo.
2. Set **Root Directory**: `apps/storefront` (first project), `apps/admin` (second). Framework preset stays Next.js; build command is preconfigured in each `vercel.json` (builds `@bakery/shared` first).
3. Environment variables:
   - Storefront: `NEXT_PUBLIC_API_URL=https://<api>/api`
   - Admin: `NEXT_PUBLIC_API_URL=https://<api>/api`, `NEXT_PUBLIC_STOREFRONT_URL=https://<storefront-url>`
4. Deploy.

Or via CLI / API (already logged in as `kjassi435`): create projects with
`rootDirectory` = `apps/storefront` / `apps/admin`, add the env vars from step 3,
then trigger a production deployment with `gitSource: { type: "github", org, repo, ref: "main" }`.
Redeploy after any env change (env vars bake into Next.js builds).

## 5. Finish

1. Back on Render, set `CORS_ORIGINS=https://<storefront>.vercel.app,https://<admin>.vercel.app` and redeploy the API.
2. Open the storefront → shop → product → cart → checkout → place a test order → confirm it in Admin → Orders.
3. Log in to Admin → Site Content → change one heading → refresh storefront to confirm the CMS round-trip.

## Regenerating the Turso schema (after Prisma schema changes)

```powershell
cd apps/api
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/turso-schema.sql
turso db shell bakes-n-sale < prisma/turso-schema.sql
```
