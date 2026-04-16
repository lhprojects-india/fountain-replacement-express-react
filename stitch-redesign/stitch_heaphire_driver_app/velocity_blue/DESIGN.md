# The Design System: Editorial Logistics & High-Trust Onboarding

## 1. Overview & Creative North Star: "The Frictionless Guardian"

To design for driver onboarding is to design for a pivotal life transition. We are moving away from the "industrial form-filler" aesthetic toward a **High-End Editorial** experience. 

Our Creative North Star is **"The Frictionless Guardian."** The system must feel as authoritative as a legacy bank but as approachable and fluid as a premium lifestyle app. We break the "SaaS template" look by using intentional white space, aggressive typographic hierarchy, and a "layered glass" depth model. We don't just collect data; we curate a journey.

---

## 2. Colors & The Surface Philosophy

Our palette balances the logic of Fintech with the energy of the logistics sector.

### The "No-Line" Rule
**Borders are a design failure.** In this system, we prohibit 1px solid borders for sectioning. Boundaries are defined exclusively through:
1.  **Background Shifts:** Using `surface-container-low` (#f2f4f6) sections against a `surface` (#f7f9fb) base.
2.  **Soft Tonal Transitions:** Utilizing our secondary-fixed colors to gently lift interactive areas.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
*   **Base:** `surface` (#f7f9fb)
*   **Layer 1 (The Canvas):** `surface-container-low` (#f2f4f6) for main content areas.
*   **Layer 2 (The Interactive):** `surface-container-lowest` (#ffffff) for floating cards and inputs.
*   **Layer 3 (The Focus):** `primary-fixed` (#d2e4ff) for active navigation or highlighted data.

### Glass & Gradient (The Visual Soul)
To move beyond "standard" UI, use **Glassmorphism** for floating overlays (Modals/Toasts). Apply `backdrop-blur: 12px` and 80% opacity to `surface-container-lowest`. 

**Signature Gradients:**
*   **The Driver Experience:** Use the `Driver App Gradient` (#BAEBFF → #93ECE5) not just as a background, but as a subtle mask for progress bars or hero illustrations.
*   **The Admin Authority:** Use the `Admin Hero Gradient` (#202B93 → #2FCCC0) for primary action headers to instill confidence and depth.

---

## 3. Typography: Editorial Authority

We use **Inter** not as a system font, but as a brand tool. 

*   **Display (700 Weight):** Massive, high-contrast scales (3.5rem) used for onboarding welcomes. It should feel like a magazine headline.
*   **Headlines (600 Weight):** Used for section titles. The tight letter-spacing (-0.02em) provides a modern, "Monzo-esque" density.
*   **Body (400 Weight):** Generous line-height (1.6) for legibility. We use `on-surface-variant` (#404752) for long-form text to reduce eye strain.
*   **Labels (500 Weight):** All-caps for overlines or small data points to create a "Logistics Terminal" feel without the clutter.

---

## 4. Elevation & Depth

We eschew the 2010s "shadow-heavy" look for **Ambient Tonal Layering.**

*   **The Layering Principle:** A card should feel "lifted" because it is a `surface-container-lowest` white block sitting on a `surface-container-low` grey background. 
*   **Ambient Shadows:** For Modals only, use a "Cloud Shadow": `0 4px 12px rgba(26, 26, 46, 0.08)`. Notice the tint—we use the `text-primary` color in the shadow to keep it natural.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in forms, use `outline-variant` (#bfc7d4) at **20% opacity**. It should be felt, not seen.

---

## 5. Components: Precision Logistics

### Buttons (The Primary Engines)
*   **Primary:** Uses a subtle gradient version of `primary` (#005ea1). 48px height for mobile driver app; 40px for admin. 8px radius.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Ghost:** No background, `primary` text. Use for low-emphasis navigation.

### Form Inputs (The Data Collectors)
*   **Container:** `surface-container-lowest` (#FFFFFF).
*   **States:** On focus, use a `2px` outer glow of `teal` (#2FCCC0) at 30% opacity. 
*   **OTP:** 6 boxes, 56px height. Use `headline-md` for the digits to make them feel impactful.

### Cards & Lists (The Clean Slate)
**Strictly no dividers.** Separate list items using 16px of vertical whitespace or by alternating `surface-container-lowest` and `surface-container-low` backgrounds. 
*   **Selected Card:** Apply a 2px `primary` internal stroke and a subtle `primary-fixed` tint to the background.

### Navigational Layers
*   **Vertical Timeline:** A core driver component. Use 999px "pills" for dots. Completed steps use the `Teal` success color; upcoming steps use `surface-dim`.
*   **Admin Sidebar:** Deep `primary-dark` (#202B93) with `on-primary` text. Use `surface-tint` to highlight the active state.

---

## 6. Do’s and Don’ts

### Do
*   **Do use asymmetric margins.** Push "Next" buttons to the far right to create a sense of forward momentum.
*   **Do use "Skeleton Loaders"** that mimic the actual typography height to prevent layout shifts.
*   **Do use the Spacing Scale (8px).** Every margin must be a multiple of 8 (16, 24, 32, 64).

### Don’t
*   **Don’t use 100% black.** Always use `text-primary` (#1A1A2E).
*   **Don’t use "Drop Shadows" on cards.** Use background color shifts instead.
*   **Don’t use standard blue links.** Use `primary` (#005ea1) with a 50% opacity underline for a modern editorial feel.
*   **Don't cram information.** If a page feels full, add 32px of white space. Then add 8px more.

---

## Director's Note
This system succeeds when it feels **inevitable**. The user shouldn't notice the grid or the buttons; they should notice the ease of progress. High-end design is the absence of visual noise.