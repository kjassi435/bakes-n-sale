# 🍰 Bakes n Sale — Premium Bakery E-Commerce Platform

A complete single-vendor bakery platform: luxury storefront, back-office admin panel, and a custom NestJS API — built as an npm-workspaces monorepo.

## Stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Storefront| Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion |
| Admin     | Next.js 15 · Tailwind CSS v4                                |
| API       | NestJS 11 · Prisma 6 · JWT auth (access + refresh rotation) |
| Shared    | `@bakery/shared` — enums, commerce constants, helpers       |
| DB        | SQLite locally (zero setup) · PostgreSQL via `docker-compose.yml` for prod |

## Quickstart

```bash
npm install          # installs all workspaces + generates Prisma client
npm run db:push      # creates the local SQLite database
npm run db:seed      # seeds catalog, users, coupons, demo orders
node apps/storefront/scripts/gen-images.mjs   # generates product SVGs
npm run dev          # boots API + storefront + admin together
```

| App       | URL                     | Notes                                   |
| --------- | ----------------------- | --------------------------------------- |
| Storefront| http://localhost:3002   | Customer shopping experience (port 3000 was taken by another app) |
| Admin     | http://localhost:3001   | Back office                             |
| API       | http://localhost:4000/api | REST API (`/api/health` to ping)      |

### Demo accounts

| Role     | Email                  | Password    |
| -------- | ---------------------- | ----------- |
| Admin    | admin@bakesnsale.com   | Admin@123   |
| Manager  | manager@bakesnsale.com | Manager@123 |
| Customer | priya@example.com      | Priya@123   |

Demo coupons: `WELCOME10`, `FESTIVE25`, `SWEET50`, `FREESHIP`.

## Feature map

**Storefront** — animated hero, category medallions, curated home sections (Fresh from the Oven, Chef's Specials, Festive Gifting), catalog with category/price/tag filters + search + sort + pagination, PDP with variant selection (size/flavour), nutrition & allergen info, reviews, cart with free-delivery progress, 3-step checkout (address → delivery date & slot → COD or simulated gateway), server-side price revalidation & coupon engine, order confirmation with live status timeline, account area (orders, addresses, wishlist, profile, loyalty points).

**Admin** — role-guarded back office: KPI dashboard (revenue, AOV, orders today, customers), 7-day revenue chart, top sellers, low-stock alerts, order management with status workflow + restock-on-cancel, product CRUD with variant matrix editor, coupon CRUD, customer directory with lifetime value.

**API** — JWT auth with refresh rotation, RBAC (ADMIN/MANAGER/SUPPORT), catalog & home feeds, checkout with transactional stock decrement, coupon validation (percent/fixed/free-shipping, min order, caps, usage limits, expiry), 5% GST + free delivery over ₹999, loyalty points, order history timeline.

## Production notes

- **Database**: switch `provider = "sqlite"` → `"postgresql"` in `apps/api/prisma/schema.prisma`, set `DATABASE_URL`, and run `docker compose up -d` (Postgres 16 + Redis included).
- **Payments**: Razorpay/Stripe slots are stubbed (`PaymentMethod` enum + `TEST_GATEWAY` simulator) — wire keys in Phase 2.
- **Images**: replace generated SVGs in `apps/storefront/public/images/products/` with real photography.
- Secrets live in `apps/api/.env` — rotate JWT secrets before deploying.
