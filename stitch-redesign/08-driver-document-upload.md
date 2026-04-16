# Stitch Prompt 08 — Driver App: Document Upload

> Reference: Design System from Prompt 00.
> Context: Drivers must upload required identity and vehicle documents. Some are mandatory, some optional. Documents go through an admin review cycle (Pending → Approved / Rejected / Requires Re-upload).

---

## Prompt

Design the **Document Upload** screen for the Laundryheap Driver Onboarding mobile app. This screen lists all required and optional documents, shows their current upload/review status, and lets drivers upload new files.

---

### Layout

- **Background:** white (document-heavy screen — avoid gradient for clarity).
- **Sticky top nav (white, 64px):**
  - Left: back chevron.
  - Center: "Documents" (H4).
  - Right: overall completion badge e.g. "2 of 5 required" in yellow pill.
- **Content:** scrollable, 16px horizontal padding.

---

### Progress Summary Card

Full-width white card (12px radius, 16px padding, subtle shadow):
- **Circular donut progress** (80px): teal arc showing e.g. 2/5. Center text: "2/5" in H2 bold, "required" in grey caption below.
- Right of donut:
  - H3: "Document Upload"
  - Body grey: "Upload all required documents to advance your application."
  - Row of 3 mini status counters: "2 Approved" (teal), "1 Pending" (yellow), "2 Missing" (grey).

---

### Required Documents Section

Section label: "REQUIRED DOCUMENTS" (overline style, grey, caps, 11px).

Show 5 document cards:

**Document card anatomy:**
- White card, 12px radius, 16px padding, `#E2E8F0` border.
- **Top row:** document name (H4 dark) + status badge (right-aligned pill).
- **Middle row:** grey caption — requirement description e.g. "Valid UK driving licence, both front and back."
- **Bottom row:** action area.

**States to show:**

1. **Approved** (e.g. Driving Licence):
   - Status badge: teal "Approved".
   - Bottom: thumbnail preview (small 48×48px document icon with a teal tick overlay) + "Uploaded Apr 9, 2026" caption + "Replace" ghost link (right).

2. **Uploaded / Pending Review** (e.g. Proof of Address):
   - Status badge: blue "Pending Review".
   - Bottom: thumbnail preview (small doc icon, blue tint) + "Under review" caption.

3. **Rejected** (e.g. Vehicle Registration):
   - Card has pink `#EF8EA2` left border (4px).
   - Status badge: pink "Rejected".
   - Pink info box below description: "Reason: Image was blurry. Please re-upload a clearer photo."
   - Bottom: **"Re-upload"** button (Destructive/outline, medium).

4. **Not Uploaded / Missing** (e.g. MOT Certificate):
   - Status badge: grey "Required".
   - Bottom: **"Upload Document"** button (Primary Blue, medium) + small camera icon.

5. **Not Uploaded / Missing** (e.g. Insurance Certificate):
   - Same as above.

---

### Optional Documents Section

Section label: "OPTIONAL DOCUMENTS" (same overline style as above).

Show 2 optional document cards:
- Same card design but status badge is grey "Optional" instead of "Required".
- One with "Upload Document" button (outline, not primary blue).
- One with "Uploaded" teal badge + thumbnail + "Replace" link.

---

### Upload Modal / Drawer (show as overlay)

When tapping "Upload Document", a bottom drawer slides up:
- **Drawer handle** (short grey pill at top, centered).
- H3: "Upload Driving Licence"
- Body grey: "Upload a clear photo of the front and back."
- **File drop zone** (dashed border, 180px tall):
  - Centered: upload cloud icon (32px, grey) + "Drag & drop a file here" H4 + "or" divider + **"Browse Files"** button (Outline, medium).
  - Accepted formats caption: "PDF, JPG, PNG up to 10MB"
- Alternative row: two icon buttons side by side — "Take Photo" (camera icon + label) and "Choose from Library" (gallery icon + label).
- Show a second state of the drawer with a file already attached:
  - File preview row: doc icon + filename "driving-licence-front.jpg" (body) + file size "2.4MB" (caption) + red × remove icon.
  - **"Upload"** button (Primary Blue, full width, active).

---

### Design Notes

- Cards with errors (Rejected) must feel urgent but not alarming — use pink accent sparingly, not the entire card background.
- The upload drawer is a common mobile pattern — keep it familiar and simple.
- Show document thumbnails as grey placeholder rectangles (no real images), with a doc icon centered.
- The sticky nav completion badge should update as documents are uploaded (show both states).
- Ensure the card spacing (8px gaps) creates a clear list feel without being too tight.
