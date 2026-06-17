---
name: Agent Frontend
description: Multi-agent AI workflow console — precise, capable, quiet.
colors:
  primary: "#0ea5e9"
  primary-hover: "#38bdf8"
  primary-muted: "rgba(14,165,233,0.15)"
  void-deep: "#020617"
  void-mid: "#0f172a"
  void-start: "#050816"
  panel: "rgba(2,6,23,0.55)"
  panel-deep: "rgba(2,6,23,0.75)"
  surface: "rgba(15,23,42,0.60)"
  surface-hover: "rgba(255,255,255,0.08)"
  surface-subtle: "rgba(255,255,255,0.05)"
  border: "rgba(255,255,255,0.10)"
  border-subtle: "rgba(255,255,255,0.08)"
  text-primary: "#f1f5f9"
  text-secondary: "#cbd5e1"
  text-tertiary: "#94a3b8"
  text-muted: "#64748b"
  success: "#34d399"
  warning: "#fbbf24"
  danger: "#fb7185"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.25em"
    textTransform: "uppercase"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  panel: "28px"
  card: "24px"
  item: "16px"
  chip: "9999px"
spacing:
  panel-inner: "20px"
  section-gap: "16px"
  item-gap: "12px"
  page-gap: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#020617"
    rounded: "{rounded.item}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.item}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-hover}"
  input:
    backgroundColor: "rgba(2,6,23,0.70)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
---

# Design System: Agent Frontend

## 1. Overview

**Creative North Star: "The Mission Console"**

Mission control for AI systems. Serious, focused, information-dense. Every pixel serves operator awareness — like a spacecraft console stripped to its essentials. The tool recedes into the task; what glows is the work, not the chrome.

This is a dark, glass-layered dashboard for orchestrating multi-agent AI workflows. Three columns — documents, chat, agent state — form the fixed architecture. The deep gradient background reads as infinite space behind the console; frosted panels float above it on atmospheric shadows. The sky-blue accent is sparse and functional: it marks the active element, the live event, the primary action. When nothing is happening, the interface is nearly monochrome. When something is, the color tells you exactly where to look.

The system rejects consumer chat aesthetics (rounded avatars, gradient bubbles, companion-like warmth) and flashy AI theatrics (neon, particles, glowing grids). Its references are Linear and Vercel dashboards: dark, minimal, high-contrast, functional. Precision through restraint and excellent typography.

**Key Characteristics:**
- Single accent (sky blue) used on ≤10% of any screen — primary actions, active selection, live indicators
- Glass panels with translucent fills and atmospheric shadows, not structural elevation
- One type family (Geist Sans) across all roles; Geist Mono reserved for data and code
- Every data section has a meaningful empty state — the system explains itself through what it displays
- Status communicated through color and text jointly, never color alone

## 2. Colors

A restrained palette: one signal accent against a deep void neutral scale. The background is not flat black but a layered gradient — deepest navy at the bottom, a subtle blue glow at top-left, a subtle rose glow at top-right. This gives the void depth without calling attention to itself.

### Primary
- **Signal Blue** (#0ea5e9): The one color that breaks the monochrome. Used for the send button, user message bubbles, active document selection, the "Latest" trace badge, and the in-progress status indicator. Its hover (#38bdf8) is a half-step brighter — noticeable but not a leap.
- **Signal Muted** (rgba(14,165,233,0.15)): The tinted background behind active or latest items. Carries the accent's hue at low opacity so the element reads as "current" without competing with the primary button.

### Neutral
- **Void Deep** (#020617): The deepest point of the page background gradient, at the bottom. Near-black with the faintest blue undertone.
- **Void Mid** (#0f172a): The gradient midpoint — slate-900 territory. Where most of the background "color" lives.
- **Void Start** (#050816): The gradient origin at the top. Slightly lighter than void-deep, with the radial glows overlaying it.
- **Panel** (rgba(2,6,23,0.55)): The standard glass-panel fill. Semi-transparent void over the gradient background, with backdrop-blur active.
- **Panel Deep** (rgba(2,6,23,0.75)): Denser glass for cards that need more separation from the background (loading cards, trace detail).
- **Surface** (rgba(15,23,42,0.60)): Raised elements sitting on glass panels — inner cards, metric tiles, plan steps.
- **Surface Hover** (rgba(255,255,255,0.08)): The hover/raised state. White at 8% opacity lifts the element without adding a border.
- **Surface Subtle** (rgba(255,255,255,0.05)): The resting state of low-emphasis interactive elements. Barely there.
- **Border** (rgba(255,255,255,0.10)): Standard panel and section dividers. White at 10% — visible but never a hard line.
- **Border Subtle** (rgba(255,255,255,0.08)): Lighter dividers for inner elements and less critical boundaries.
- **Text Primary** (#f1f5f9): Body text, headings, primary labels. Near-white with slight warmth.
- **Text Secondary** (#cbd5e1): Supporting text, descriptions, secondary labels.
- **Text Tertiary** (#94a3b8): Metadata, timestamps, less important labels. Still above 4.5:1 contrast on panel backgrounds.
- **Text Muted** (#64748b): The quietest text — placeholder, empty-state body, disabled labels.

### Semantic States
- **Success** (#34d399 emerald-400): Approve buttons, completed status, success badges.
- **Warning** (#fbbf24 amber-400): Approval-needed cards, pending states, warning badges.
- **Danger** (#fb7185 rose-400): Reject buttons, error text, failure states.

### Named Rules
**The One Accent Rule.** Signal Blue is used on ≤10% of any given screen. Its rarity is the point. When everything is blue, nothing is important.

**The Glass Constraint.** Panels use translucent fills (rgba with alpha ≤ 0.55) over the gradient background, with backdrop-blur. A panel at full opacity signals an error — the depth effect requires the background to breathe through.

**The Text Contrast Floor.** No text on a panel background falls below 4.5:1 contrast. Text Muted (#64748b on the darkest panels) is the floor; if a background is lighter, the text must be darker. Placeholder text carries the same contrast requirement as body text.

## 3. Typography

**Display Font:** Geist Sans (with system-ui, sans-serif fallback)
**Body Font:** Geist Sans (same family)
**Mono Font:** Geist Mono (with ui-monospace, monospace fallback)

**Character:** A single well-tuned sans-serif carries the entire interface. Geist Sans is Vercel's precision typeface — geometric enough to feel technical, humanist enough to stay readable at 12px labels and dense data. Geist Mono is reserved for code blocks, trace data, and artifact values. No display/body pairing; product UI doesn't need one.

### Hierarchy
- **Display** (600w, 24px, 1.3 line-height, -0.02em tracking): Panel titles and the console heading. Only the top-level labels in each column. Exactly two or three per screen.
- **Body** (400w, 14px, 1.75 line-height): Chat messages, descriptions, route reasons, metric values. The workhorse. Line length capped at 72ch in chat; wider in data panels.
- **Label** (500w, 12px, 0.25em tracking, uppercase): Section eyebrows — "Documents", "Metrics", "Plan", "Artifacts". Used sparingly and only as a section opener, never stacked. Wider tracking variants (0.35em) for the top-level column labels.
- **Mono** (400w, 12px, 1.5 line-height): Trace event data, artifact JSON, code snippets. Wrapped in pre elements with overflow-x auto.

### Named Rules
**The One Family Rule.** Geist Sans for everything; Geist Mono only for code and data. No third font. No display serif. The hierarchy is weight and size, not face.

**The Eyebrow Constraint.** Section labels use uppercase tracking at one size (12px). They open a section and stop. No stacked eyebrows, no eyebrow-on-eyebrow, no eyebrow before every interactive element.

## 4. Elevation

Depth through atmosphere, not structural shadows. The page background is a deep gradient (void-start → void-mid → void-deep) with two radial glows — sky at top-left, rose at top-right — that create the sense of infinite space behind the console. Glass panels float above this void with translucent fills (rgba with alpha ≤ 0.55) and backdrop-blur, carrying a single deep shadow (0 20px 80px at rgba(15,23,42,0.4)) that lifts them without casting hard edges.

Raised elements within panels (metric tiles, plan steps, trace cards) use Surface fills (rgba(15,23,42,0.60)) — slightly lighter than the panel — to step forward. The "Latest" trace event adds a subtle glow ring (0 0 0 1px sky at 15% opacity) as the only active depth cue. Hover states lift via Surface Hover (white at 8%) without additional shadow.

### Shadow Vocabulary
- **Panel Float** (`box-shadow: 0 20px 80px rgba(15,23,42,0.4)`): The standard panel shadow. Deep, diffuse, atmospheric. Used on the chat panel and session header.
- **Panel Float Lighter** (`box-shadow: 0 20px 80px rgba(15,23,42,0.35)`): Sidebar panels. Slightly softer to keep the focus on the center column.
- **Live Glow** (`box-shadow: 0 0 0 1px rgba(125,211,252,0.15)`): The "Latest" trace event ring. A one-pixel spread in sky blue — the only structural shadow in the system.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces are flat at rest. Shadows appear only on the outermost glass panels by default. Inner elements lift through tonal shift (surface → surface-hover), not additional shadow. The live glow ring is the exception — reserved exclusively for the single most recent trace event.

## 5. Components

### Buttons
- **Shape:** Generous radius (16px — rounded-2xl). No sharp corners; the radius is part of the tactile confidence.
- **Primary:** Signal Blue background (#0ea5e9), void-deep text. 12px 24px internal padding. 14px/600w text. Used exactly once per column maximum.
- **Hover / Focus:** Lifts to primary-hover (#38bdf8). No shadow, no scale — just the color shift. Transition: 150ms.
- **Ghost:** Surface Subtle background, text-secondary text, subtle border. 8px 16px padding. Used for secondary actions (New Session, Expand, Copy).
- **Ghost Hover:** Background shifts to Surface Hover (white 8%). Border unchanged.
- **Disabled:** opacity-40 (primary) or opacity-50 (ghost), cursor not-allowed. No other visual change.
- **Approve:** Emerald-400 background, void-deep text. Same shape and padding as primary.
- **Reject:** Rose-400/10 background with rose-100 text, rose-300/30 border. No solid fill — rejection is a bordered action, not a committed one.

### Chips / Badges
- **Style:** Rounded-full border with transparent background and tinted text. 10-12px font, 0.15-0.18em uppercase tracking. The color communicates the category: sky for agent names and in-progress, emerald for artifact types and completed, amber for approval-needed, rose for rejected, slate for idle.
- **"Latest" Badge:** sky-300/20 background, sky-100 text. Only appears on the most recent trace event. Rounded-full.

### Cards / Containers
- **Corner Style:** Panel corners at 28px, inner cards at 24px (rounded-3xl), innermost items at 16px (rounded-2xl). The nesting radius steps inward deliberately.
- **Background:** Translucent fills on the void gradient. Panel → Surface → Surface Subtle as nesting deepens.
- **Shadow Strategy:** Only the outermost panels carry Panel Float shadows. Inner cards lift through tone, not shadow.
- **Border:** Border (white 10%) on panels, Border Subtle (white 8%) on inner sections and cards.
- **Internal Padding:** Panel = 20px, section = 16px, inner card = 12px.

### Inputs / Fields
- **Style:** Panel Deep background (rgba(2,6,23,0.70)), Border stroke, 24px radius, 16px 20px padding. 14px body text in text-primary.
- **Focus:** Border shifts to Signal Blue at 60% opacity (`border-sky-400/60`). No glow ring. Transition: 150ms.
- **Placeholder:** Text Muted (#64748b) — meets 4.5:1 contrast on the input background.
- **Disabled:** Not applicable (the single textarea is always active when not loading).

### Navigation
This is a single-page console with no traditional navigation. The three-column layout IS the navigation: Document Sidebar (left, 280px) → Chat Panel (center, fluid) → Workflow Sidebar (right, 360px). The session header bar spans above the chat column. The "New Session" button resets state. No top bar, no tabs, no breadcrumbs.

### Message Bubbles
- **User:** Signal Blue solid background, white text. Rounded-3xl (24px) with bottom-right corner at 6px (rounded-br-md). Right-aligned. Max-width ~48rem. The asymmetry distinguishes sender without avatars.
- **Assistant:** Surface Hover background (white 8%), text-primary text, Border stroke. Rounded-3xl with bottom-left corner at 6px (rounded-bl-md). Left-aligned. Max-width ~48rem. 14px body text with 1.75 line-height.
- **Loading (Workflow Progress Card):** Panel Deep background with sky-300/20 border and subtle shadow. Shows latest 3 trace events with the newest highlighted in Signal Muted. Displays the workflow status and pending approval reason when applicable.

### Status Badges
- **Shape:** Rounded-full, border with 40% opacity in the status color, background at 15% opacity, text in the light end of the status hue. 12px font. Used in the chat header and workflow sidebar header.
- **States:** Completed (emerald), Awaiting Approval (amber), Rejected (rose), Running/Planning/Resuming (sky), Idle (slate). Each state has exactly one color — no variation within a state.

### Named Rules
**The One Primary Button Rule.** At most one solid Signal Blue button per column. If two actions compete, the primary gets the solid fill and the secondary becomes a ghost.

**The Corner Rhythm Rule.** Radius steps inward with nesting: 28px (panel) → 24px (card) → 16px (item) → full (chip). Never use the same radius on two adjacent nesting levels.

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Blue exclusively for primary actions, active selection, and live indicators. It should never appear as decoration.
- **Do** maintain the glass constraint: panels at rgba(2,6,23,0.55) with backdrop-blur over the void gradient. If a panel needs more separation, deepen to 0.75; never go opaque.
- **Do** keep the three-column layout at all viewports that support it (≥1024px). Below that, stack to single column.
- **Do** pair every empty data section with a meaningful placeholder sentence that explains what will appear and when.
- **Do** communicate status through both color and a text label. The badge color alone is not enough.
- **Do** use Geist Sans for all UI text. Geist Mono only in pre elements for code, trace data, and artifact JSON.
- **Do** respect the corner rhythm: 28 → 24 → 16 → full. Never flatten all corners to one radius.
- **Do** keep transitions at 150ms. Users are in flow; don't make them wait.

### Don't:
- **Don't** use consumer chat aesthetics: no rounded avatars, no gradient message bubbles, no companion-like warmth, no casual conversational tone.
- **Don't** use flashy AI theatrics: no neon palettes, no animated particles, no glowing grid backgrounds, no "cyberpunk terminal" cliches.
- **Don't** use enterprise SaaS chrome: no cluttered headers, no heavy tab bars, no nested sidebars, no white/light-mode layouts.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or callouts.
- **Don't** apply gradient text (background-clip: text). Use a single solid color from the neutral scale.
- **Don't** use identical card grids with icon + heading + text repeated across a section.
- **Don't** stack tiny uppercase tracked eyebrows above every section. The label style opens a section and stops.
- **Don't** add a second accent color. The system works with one signal color; adding a second collapses the hierarchy.
- **Don't** use shadows on inner elements. Panel Float is reserved for the outermost glass panels.
