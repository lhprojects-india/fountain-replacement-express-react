# Stitch Prompt 16 — Admin Panel: Settings

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: The Settings section has a sidebar-within-the-page navigation and multiple sub-sections: Regions, Facilities, Fee Structures, Email Templates, Questionnaires, and Team.

---

## Prompt

Design the **Settings** section for the Laundryheap Driver Onboarding Admin Panel. The Settings page uses a two-panel layout: a left secondary sidebar with navigation tabs, and the right content panel showing the active settings section.

Use the App Shell from Prompt 10 as the outer frame.

### ATS Direction Guardrails (Important)

- Treat settings as **ATS administration** (roles, templates, pipeline rules, questionnaires, compliance requirements).
- Avoid logistics configuration patterns (route templates, dispatch zones, fleet assets).
- Keep labels and controls in recruiting language: **stages, interview templates, reviewer permissions, approval rules, candidate messaging**.

---

### Settings Layout (Two-panel inside main content area)

**Left secondary sidebar (220px):**
- White card, full height of content area.
- "Settings" label at top (H3, 16px padding).
- Thin divider.
- Vertical nav list (same style as App Shell sidebar but lighter):
  - Items: Regions, Facilities, Fee Structures, Email Templates, Questionnaires, Team.
  - Item height: 44px, 16px left padding, icon (16px, grey) + label (14px, 500).
  - Default: grey icon + dark grey label.
  - Active: teal left bar (3px), primary blue label, light blue tint bg.

**Right content panel (remaining width):**
- White card, full height, 24px padding.
- Content changes based on active settings section.

---

### Section 1 — Regions (show as primary active section)

**Content header:**
- H2: "Regions"
- Grey caption: "Manage the regions where Laundryheap operates."
- Right: **"+ Add Region"** (Primary Blue, medium).

**Regions table:**
Columns: Region Name | Cities | Active Jobs | Status | Actions.

Rows (4 regions):
1. London | 3 cities | 8 jobs | Active (teal badge) | Edit / Delete icons.
2. Manchester | 1 city | 3 jobs | Active (teal badge) | Edit / Delete.
3. Birmingham | 1 city | 1 job | Inactive (grey badge) | Edit / Delete.
4. Edinburgh | 1 city | 2 jobs | Active (teal badge) | Edit / Delete.

Alternating row tints. Delete icon is grey (turns pink on hover).

**Add/Edit Region modal (show as overlay):**
- H2: "Add Region"
- Fields: Region Name (text input), Description (textarea), Cities (tag input — type city name, press Enter to add pill chips).
- Status toggle: Active / Inactive.
- "Save Region" (Primary Blue, full width) + "Cancel" (Ghost).

---

### Section 2 — Email Templates (show as a second frame)

**Content header:**
- H2: "Email Templates"
- Grey caption: "Customise automated emails sent to drivers."
- Right: **"+ New Template"** (Primary Blue, medium).

**Two-panel layout inside content:**

Left list (240px): scrollable list of template cards.
Each card: template name (H4) + trigger event (caption, e.g. "On Stage Advance") + status chip (Active/Draft). Active card has blue left border.

Right preview panel: shows the selected template.
- Template name field (editable, H3 heading).
- Subject line field (editable text input).
- HTML body preview (read-only white box with the rendered email — use placeholder lorem paragraphs with Laundryheap branding colors).
- Variable chips: show available merge variables as blue pill chips: `{{driver_name}}`, `{{stage}}`, `{{facility_name}}` — draggable into the body.
- Footer: "Edit Template" (Primary Blue) + "Send Test" (Outline) + "Deactivate" (Ghost, grey).

---

### Section 3 — Team (show as a third frame)

**Content header:**
- H2: "Team Members"
- Grey caption: "Manage admin access to this portal."
- Right: **"+ Invite Admin"** (Primary Blue, medium).

**Team members table:**
Columns: Member | Role | Last Active | Status | Actions.

Rows (4 members):
1. Sarah Anderson | Super Admin (navy badge) | 2 min ago | Active (teal) | — (can't edit own role).
2. Michael Roberts | Admin (blue badge) | 1 hour ago | Active (teal) | Edit / Remove.
3. Priya Sharma | Admin (blue badge) | Yesterday | Active (teal) | Edit / Remove.
4. Tom Wilson | Viewer (grey badge) | 3 days ago | Active (teal) | Edit / Remove.

**Invite Admin modal (show as overlay):**
- H2: "Invite Team Member"
- Fields: Email address (input) + Role select dropdown (Super Admin / Admin / Viewer) with role descriptions below each option.
- "Send Invite" (Primary Blue, full width).

---

### Section 4 — Fee Structures (thumbnail frame only)

Smaller thumbnail showing:
- List of fee tiers per region.
- Edit inline with a rate input field + currency selector.
- "Save Changes" button at bottom.

### Section 5 — Questionnaire Builder (thumbnail frame only)

- Drag-and-drop question list (DnD kit style).
- Each question row: drag handle ⠿ + question text + question type chip (Text, Multiple Choice, Yes/No) + edit/delete icons.
- "Add Question" button at bottom.
- Add Question modal: question text input + type selector (button group) + options list (if multiple choice).

---

### Design Notes

- The secondary sidebar inside settings should feel like a different "depth" from the main app sidebar — use lighter colors (no navy).
- The Email Template preview panel is important — show it looking like a real email preview.
- All CRUD modals (Add/Edit/Delete) follow the same modal template from the design system.
- Show the full 1280×800px frame with "Settings" active in the main sidebar.
