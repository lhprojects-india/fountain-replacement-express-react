# Week 2 — Day 5: Document Requirements & Admin Settings

## Context

This week we've built driver auth, the driver dashboard, admin pipeline view, and stage transition actions. The core portal is functional. Today we close out Week 2 with configuration management.

**Previous day**: Admin stage transitions — transition/rejection dialogs, bulk actions, admin notes, quick row actions.

**What we're building today**: Document requirement configuration per city and a consolidated admin settings area. This prepares for the document upload flow in Week 6.

## Today's Focus

1. Document requirement CRUD API
2. Admin settings page structure
3. Document requirements management UI
4. City-specific settings consolidation

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/documents/document-requirement.service.js`

Functions:
- `getRequirementsByCity(cityId)` — list all document requirements for a city, sorted
- `createRequirement(data)` — validate: cityId exists, code unique per city
- `updateRequirement(id, data)` — update fields
- `deleteRequirement(id)` — only if no submissions reference this code for the city
- `getDefaultRequirements()` — return a standard set for new cities:
  ```javascript
  [
    { code: 'selfie', name: 'Selfie Photo', fileTypes: 'image/jpeg,image/png', isRequired: true, maxSizeMb: 5 },
    { code: 'driving_license', name: 'Driving License', fileTypes: 'image/jpeg,image/png,application/pdf', isRequired: true, maxSizeMb: 10 },
    { code: 'vehicle_photo', name: 'Vehicle Photo', fileTypes: 'image/jpeg,image/png', isRequired: true, maxSizeMb: 10 },
    { code: 'id_document', name: 'ID Document', fileTypes: 'image/jpeg,image/png,application/pdf', isRequired: true, maxSizeMb: 10 },
    { code: 'vehicle_video', name: 'Vehicle Video', fileTypes: 'video/mp4,video/webm', isRequired: true, maxSizeMb: 100, maxDurationSec: 120 },
  ]
  ```
- `seedDefaultRequirements(cityId)` — create defaults for a new city

#### 2. `apps/backend/src/modules/documents/document.routes.js`

Admin routes:
```
GET    /api/document-requirements/city/:cityId  — list for city
POST   /api/document-requirements                    — create
PUT    /api/document-requirements/:id                — update
DELETE /api/document-requirements/:id                — delete
POST   /api/document-requirements/seed/:cityId     — seed defaults for city
```

#### 3. Auto-seed on city creation

Update `city.service.js` `createCity()` to optionally call `seedDefaultRequirements(newCity.id)` after creating a city. Add a `seedDocumentDefaults: boolean` flag to the create city request.

#### 4. Enhance city creation to include payment field templates

When a city is created, provide preset payment field schemas. Add a helper:
```javascript
export const PAYMENT_PRESETS = {
  UK: {
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'account_number', label: 'Account Number', type: 'text', required: true },
      { key: 'sort_code', label: 'Sort Code', type: 'text', required: true },
    ]
  },
  EU: {
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', required: true },
      { key: 'bic', label: 'BIC/SWIFT', type: 'text', required: true },
    ]
  },
  // ... more presets
};
```

### Frontend (Admin Web)

#### 1. `apps/admin-web/src/components/admin/DocumentRequirementManager.jsx`

Nested within the City detail view or as part of a Settings area.

**Per-city document requirements:**
- Table: Name, Code, File Types, Required?, Max Size, Max Duration (video), Actions
- "Add Requirement" button → dialog with fields:
  - Name (text)
  - Code (text, auto-generated from name, editable)
  - File types (multi-select: JPEG, PNG, PDF, MP4, WebM)
  - Required (toggle)
  - Max file size MB (number)
  - Max duration seconds (number, only shown if video types selected)
  - Sort order (number)
- Edit and delete actions per row
- "Seed Defaults" button to populate standard requirements

#### 2. Enhance `CityManager.jsx`

When viewing a city's details, show two sections:
1. **City settings** — existing fields (currency, timezone, country, etc.)
2. **Payment Fields Configuration** — visual editor for `paymentFieldsSchema`:
   - List of fields with drag-to-reorder (or sort order)
   - Each field: key, label, type (text/number/select), required toggle
   - Add/remove fields
   - Preset buttons: "UK Bank Details", "EU SEPA", etc.
3. **Document Requirements** — the DocumentRequirementManager component
4. **Contract Templates** — existing ContractTemplateManager

This makes the City page a hub for all city-specific configuration.

#### 3. Update `admin-services.js`

Add:
```javascript
getDocumentRequirements(cityId)
createDocumentRequirement(data)
updateDocumentRequirement(id, data)
deleteDocumentRequirement(id)
seedDocumentDefaults(cityId)
```

#### 4. Admin Settings Tab consolidation

Rename the admin tabs to better reflect the new structure:
- **Pipeline** (default) — application list + transitions
- **Jobs** — job management
- **Settings** — sub-tabs:
  - Cities (with nested contract templates, document requirements, payment config)
  - Fee Structures (existing)
  - Facilities (existing)
  - Team (admin management, existing)

This keeps the dashboard clean while providing deep configuration access.

## Acceptance Criteria

- [ ] Document requirement CRUD API works
- [ ] Default requirements can be seeded for a city
- [ ] City creation can auto-seed document defaults
- [ ] Payment field schema presets work
- [ ] Admin UI shows document requirements per city
- [ ] Admin can add/edit/delete requirements
- [ ] File type multi-select works correctly
- [ ] Max duration field only shows for video types
- [ ] Settings tab consolidation renders correctly
- [ ] City detail shows all configuration sections

## What's Next (Week 3, Day 1)

Week 3 focuses on the **admin pipeline enhancement**. Day 1 starts with building a **Kanban board view** as an alternative to the table view — admins can drag-and-drop applications between stages.
