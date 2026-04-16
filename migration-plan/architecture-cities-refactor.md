# Cities refactor (replaces “regions” in code and API)

Earlier migration-plan documents referred to **regions**, `Region`, `/api/regions`, and `regionId`. The product model is now **cities**: one row per operating city with currency, timezone, payment schema, and an explicit **country** field.

## Database

- **Table**: `cities` (formerly `regions`), mapped in Prisma as model **`City`** (`@@map("cities")`).
- **Columns** (conceptual): `id`, `city`, `city_code`, `country` (default `"Unknown"` for legacy rows), `currency`, `currency_symbol`, `timezone`, `payment_fields_schema`, `is_active`, `created_at`, `updated_at`.
- **Foreign keys** on `contract_templates`, `jobs`, `document_requirements`, `questionnaires` use **`city_id`** (Prisma: `cityId`).

Migration: `apps/backend/prisma/migrations/20260410200000_regions_to_cities/migration.sql`.

## Backend

- **Routes**: `GET/POST/PUT/DELETE /api/cities` (admin), not `/api/regions`.
- **Module**: `apps/backend/src/modules/regions/` holds **`city.*.js`** (`city.routes.js`, `city.controller.js`, `city.service.js`, `city.schemas.js`). Legacy `region.*.js` files may still exist but are not mounted.
- **Payloads**: use `city`, `cityCode`, `country`, and `cityId` on jobs, contracts, document requirements, filters, and analytics query params.
- **Contract templates**: `GET /api/contract-templates/city/:cityId`.
- **Document requirements**: paths use `/city/:cityId` where applicable.
- **Driver**: `GET /api/driver/application/city-config` (replaces `region-config`).
- **Analytics**: e.g. `GET /api/analytics/cities`, `getCityBreakdown`, filters `cityId` / `cityIds` (some handlers still accept `regionId` as a temporary alias).

After any Prisma schema change, run:

```bash
cd apps/backend && npx prisma migrate deploy   # apply SQL
cd apps/backend && npx prisma generate         # refresh client (required for runtime)
```

## Admin web

- **Settings**: `/settings/cities` (“Cities”), component **`CityManager`**, not `RegionManager`.
- **Admin API client**: `getAllCities`, `getContractTemplatesByCity`, `getAnalyticsCities`, etc.

## Driver web

- Public job payload exposes **`job.city`** (`city`, `cityCode`, `country`, currency, timezone).
- **`getApplicationCityConfig()`** calls `/driver/application/city-config`.

## Reading older plan docs

Anywhere the plan says “region”, “Region”, `/api/regions`, or `regionId`, interpret it using the **City** / **`cityId`** / **`/api/cities`** equivalents above unless the sentence is explicitly about a geographic “region” in plain English.
