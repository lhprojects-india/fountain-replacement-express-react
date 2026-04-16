# Week 1 — Day 3: City & Contract Template Management

> **Naming:** This day was originally titled “Region & Contract Template Management.” The live codebase uses **cities** (`City` model, `cities` table, `/api/cities`). See [architecture-cities-refactor.md](../architecture-cities-refactor.md).

## Context

We are building a full hiring lifecycle platform. On Day 1 we designed and applied the new database schema. On Day 2 we built the stage transition engine with transition matrix, guards, actions, and the core `transitionApplication()` function.

**Previous day**: Stage engine built — transition matrix, guards, actions, `transitionApplication()` API, history logging.

**What we're building today**: City setup and contract template management. Admins need to create cities (with country, currency, timezone, payment requirements) and contract templates before jobs can be created.

## Today's Focus

1. City CRUD API (backend module under `modules/regions/`, files `city.*.js`)
2. Contract template CRUD API (backend module)
3. Admin UI for city management (settings route, `CityManager` component)
4. Admin UI for contract template management

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/regions/city.schemas.js`

Zod validation schemas:

- `createCitySchema`: `city` (required), `cityCode` (required), `country` (optional; defaults to `"Unknown"`), `currency` (required), `currencySymbol` (required), `timezone` (required), `paymentFieldsSchema` (optional JSON), `isActive` (default true)
- `updateCitySchema`: all fields optional

The `paymentFieldsSchema` should be a JSON object that describes what payment fields are required for this city. Example:

```json
{
  "fields": [
    { "key": "bank_name", "label": "Bank Name", "type": "text", "required": true },
    { "key": "account_number", "label": "Account Number", "type": "text", "required": true },
    { "key": "sort_code", "label": "Sort Code", "type": "text", "required": true },
    { "key": "iban", "label": "IBAN", "type": "text", "required": false }
  ]
}
```

#### 2. `apps/backend/src/modules/regions/city.service.js`

Functions:

- `createCity(data)` — validate + create
- `updateCity(id, data)` — validate + update
- `getCity(id)` — single city with contract templates
- `getAllCities()` — list all, include counts (jobs, templates)
- `deleteCity(id)` — soft-delete (`isActive = false`) if no active jobs reference it
- `getCityByCode(code)` — lookup by `cityCode`

#### 3. `apps/backend/src/modules/regions/city.controller.js`

Express handlers wrapping service functions with error handling.

#### 4. `apps/backend/src/modules/regions/city.routes.js`

```
GET    /api/cities              — list all cities (admin)
GET    /api/cities/:id          — get city by ID (admin)
POST   /api/cities              — create city (admin, super_admin/app_admin only)
PUT    /api/cities/:id          — update city (admin)
DELETE /api/cities/:id          — soft-delete city (admin, super_admin only)
```

#### 5. `apps/backend/src/modules/contracts/contract.schemas.js`

Zod validation:

- `createContractSchema`: `cityId` (required), `name` (required), `type` (required, enum: full_time/part_time/contractor), `dropboxSignTemplateId` (optional), `content` (optional text), `isActive` (default true)
- `updateContractSchema`: all optional

#### 6. `apps/backend/src/modules/contracts/contract.service.js`

Functions:

- `createContractTemplate(data)` — validate city exists, create
- `updateContractTemplate(id, data)` — update
- `getContractTemplate(id)` — single template with city
- `getContractTemplatesByCity(cityId)` — list for a city
- `getAllContractTemplates()` — list all with city name
- `deleteContractTemplate(id)` — soft-delete if not referenced by active jobs

#### 7. `apps/backend/src/modules/contracts/contract.controller.js` + `contract.routes.js`

```
GET    /api/contract-templates                    — list all (admin)
GET    /api/contract-templates/:id                — get by ID (admin)
GET    /api/contract-templates/city/:cityId       — list by city (admin)
POST   /api/contract-templates                    — create (admin)
PUT    /api/contract-templates/:id                — update (admin)
DELETE /api/contract-templates/:id                — soft-delete (admin)
```

#### 8. Mount Routes

In `apps/backend/src/index.js`, import and mount:

```javascript
const cityRoutes = (await import('./modules/regions/city.routes.js')).default;
import contractRoutes from './modules/contracts/contract.routes.js';

app.use('/api/cities', authenticateToken, authorizeAdmin, cityRoutes);
app.use('/api/contract-templates', authenticateToken, authorizeAdmin, contractRoutes);
```

### Frontend (Admin Web)

#### 1. Settings: “Cities” in the admin shell

Route e.g. `/settings/cities` renders `CityManager` (legacy path `/settings/cities` may still redirect for bookmarks).

#### 2. `apps/admin-web/src/components/admin/CityManager.jsx`

Features:

- **List view**: Table with columns: City, City code, Country, Currency, Timezone, Active status, # Jobs, Actions
- **Create dialog**: Form with city name, city code, country, currency, currency symbol, timezone, payment fields schema (JSON), optional seed document defaults
- **Edit dialog**: Same form, pre-populated
- **Delete**: Confirmation dialog, calls soft-delete
- **Expandable row or detail panel**: Shows contract templates for the city

#### 3. `apps/admin-web/src/components/admin/ContractTemplateManager.jsx`

Features (could be inline within `CityManager` or a sub-tab):

- **List**: Name, Type, Has Dropbox Sign Template, Active status
- **Create/Edit dialog**: Name, Type dropdown (full_time/part_time/contractor), Dropbox Sign Template ID (text input), Content (textarea for preview/fallback)
- **Delete**: Confirmation dialog

#### 4. `apps/admin-web/src/lib/admin-services.js`

Add new service methods:

```javascript
// Cities
getAllCities()
createCity(data)
updateCity(id, data)
deleteCity(id)

// Contract Templates
getAllContractTemplates()
getContractTemplatesByCity(cityId)
createContractTemplate(data)
updateContractTemplate(id, data)
deleteContractTemplate(id)
```

## Acceptance Criteria

- [ ] City CRUD API working (all 5 endpoints under `/api/cities`)
- [ ] Contract template CRUD API working (all 6 endpoints)
- [ ] Validation errors return clear messages
- [ ] Cannot delete city with active jobs
- [ ] Admin UI shows cities settings page with list + create/edit/delete
- [ ] Admin UI shows contract templates per city
- [ ] Payment fields schema can be saved as JSON
- [ ] All admin endpoints require authentication

## What's Next (Day 4)

Tomorrow we build **Job management** — creating jobs linked to cities and contract templates, generating public apply links, and the admin UI for managing job postings.
