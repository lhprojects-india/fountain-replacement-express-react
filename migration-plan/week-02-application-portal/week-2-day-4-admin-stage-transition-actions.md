# Week 2 — Day 4: Admin Stage Transition Actions

## Context

We've built the application pipeline view (Day 3) where admins can see all applications in a filtered table and open detail panels. Now we need the actual stage management workflow.

**Previous day**: Admin application inbox — filtered/paginated application list, detail panel with profile + timeline, stage badges.

**What we're building today**: Full admin stage transition workflow — moving applications through stages with confirmation, bulk actions, and admin notes.

## Today's Focus

1. Transition confirmation dialogs
2. Rejection flow with reasons
3. Admin notes (add/edit on applications)
4. Bulk stage transitions
5. Quick actions in the application row

## Detailed Changes

### Backend

#### 1. Update admin notes endpoint

Add to `apps/backend/src/modules/applications/application.service.js`:
- `updateApplicationNotes(applicationId, notes, adminEmail)` — update `adminNotes` field

Add to `apps/backend/src/modules/applications/application.routes.js`:
```
PUT /api/applications/:id/notes — { notes }
```

#### 2. Bulk transition endpoint

Add to `apps/backend/src/modules/workflow/stage-engine.js`:
- `bulkTransitionApplications(applicationIds, toStage, { actorEmail, reason })`:
  - Iterates through IDs, runs transitionApplication for each
  - Collects results: `{ succeeded: [...], failed: [...] }`
  - Failed items include the applicationId + error reason

Add route:
```
POST /api/workflow/applications/bulk-transition
Body: { applicationIds: number[], toStage: string, reason?: string }
Response: { succeeded: [...ids], failed: [{ id, error }] }
```

#### 3. Add rejection reasons as a configurable list

Add to `apps/backend/src/modules/workflow/transition-matrix.js`:
```javascript
export const REJECTION_REASONS = [
  'does_not_meet_requirements',
  'failed_screening',
  'documents_invalid',
  'failed_questionnaire',
  'failed_first_block',
  'no_response',
  'duplicate_application',
  'other',
];

export const REJECTION_REASON_LABELS = {
  does_not_meet_requirements: 'Does not meet requirements',
  failed_screening: 'Failed screening',
  documents_invalid: 'Invalid or fraudulent documents',
  failed_questionnaire: 'Failed assessment questionnaire',
  failed_first_block: 'Failed first block',
  no_response: 'No response from candidate',
  duplicate_application: 'Duplicate application',
  other: 'Other',
};
```

### Frontend (Admin Web)

#### 1. `apps/admin-web/src/components/admin/TransitionDialog.jsx`

A modal dialog for stage transitions:

**For forward transitions:**
- Title: "Move to {next stage label}?"
- Description: "This will move {applicant name}'s application from {current stage} to {next stage}."
- Optional: Reason/notes textarea
- Buttons: [Cancel] [Confirm]

**For rejections:**
- Title: "Reject Application?"
- Rejection reason dropdown (from `REJECTION_REASONS`)
- Required: Reason must be selected
- Optional: Additional notes textarea
- Warning banner: "This action will reject the application and notify the candidate."
- Buttons: [Cancel] [Reject] (red)

**Loading state:** Disable buttons + show spinner during API call.

**Success:** Close dialog, refresh application list, show toast.

**Error:** Show error message inline in dialog.

#### 2. Update `ApplicationDetailPanel.jsx` actions

The footer actions section becomes more sophisticated:

```jsx
<div className="action-footer">
  {/* Primary action — next stage */}
  {availableTransitions.filter(t => t !== 'rejected' && t !== 'withdrawn').map(stage => (
    <Button onClick={() => openTransitionDialog(stage)}>
      Move to {stageLabelMap[stage]}
    </Button>
  ))}

  {/* Reject action — always available from allowed stages */}
  {availableTransitions.includes('rejected') && (
    <Button variant="destructive" onClick={() => openRejectDialog()}>
      Reject
    </Button>
  )}
</div>
```

#### 3. Quick row actions in `ApplicationPipeline.jsx`

Add a dropdown menu (three-dot menu) on each row with:
- View Details → opens detail panel
- Move to {next stage} → opens transition dialog (only shows the primary forward transition)
- Reject → opens reject dialog (if allowed from current stage)
- Add Note → opens a simple note dialog

#### 4. Bulk selection + actions

Add checkbox column to the table:
- Header checkbox: select all on current page
- Row checkboxes: select individual
- When selections exist, show a floating action bar at the bottom:
  ```
  ┌──────────────────────────────────────────┐
  │ {n} selected  [Move to Screening] [Reject] [Clear] │
  └──────────────────────────────────────────┘
  ```
- Bulk "Move to" only shows transitions that are valid for ALL selected applications (intersection of available transitions)
- Bulk reject shows the rejection dialog with a count "Reject {n} applications?"

#### 5. `apps/admin-web/src/components/admin/AdminNotesDialog.jsx`

Simple dialog for adding/editing admin notes on an application:
- Textarea pre-filled with existing notes
- [Save] button → `PUT /api/applications/:id/notes`
- Toast on success

#### 6. Update `admin-services.js`

Add:
```javascript
updateApplicationNotes(id, notes)
bulkTransitionApplications(ids, toStage, reason?)
```

## Acceptance Criteria

- [ ] Transition dialog shows correct information for forward transitions
- [ ] Rejection dialog requires a reason selection
- [ ] Successful transition refreshes the application list
- [ ] Error during transition shows clear message (e.g., guard failure)
- [ ] Admin notes can be added/edited
- [ ] Bulk selection with checkboxes works
- [ ] Bulk transition only shows valid shared transitions
- [ ] Bulk transition results show success/failure count
- [ ] Quick row actions menu works
- [ ] Toast notifications on success/error

## What's Next (Day 5)

Tomorrow we add **document requirement configuration** and the **admin settings panel** — admins can configure what documents each city requires, manage document types, and set up the requirements that drivers will need to fulfill later.
