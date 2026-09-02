# Costwise — Design system

Light theme, restrained colour, one type family. Tailwind tokens live in `tailwind.config.js`; component classes in `src/index.css`; data-viz colour meanings in `src/lib/palette.js`.

## Theme

**Light, permanently.** Scene: bright back office / phone on the floor in daylight, short interrupted sessions. Dark mode is not planned; a dim-room premise does not exist for this user.

## Colour

Strategy: **Restrained.** Tinted neutrals carry the surface; the brand green is reserved for primary action, current selection, positive state and the profit series. It should never exceed roughly 10% of a screen.

### Neutrals — `ink`

Cool-tinted grey ramp. Never pure `#000` or `#fff` for text; `ink-950` is the darkest ink, white is used only as a card/panel surface.

| Token | Hex | Use |
|---|---|---|
| `ink-50` | `#f6f7f9` | App background, hover fills |
| `ink-100` | `#eceef2` | Hairlines inside cards, chart grid, track fills |
| `ink-200` | `#d5dae2` | Borders, dividers, input borders |
| `ink-300` | `#b0b9c8` | Disabled text, empty-state icons |
| `ink-400` | `#8492a8` | Tertiary text, chart axis, icon default |
| `ink-500` | `#64748b` | Secondary text, labels |
| `ink-600` | `#4d5a6e` | Body text |
| `ink-800` | `#2b333f` | Strong body, table cell values |
| `ink-900` | `#1b212a` | Headings, primary values, revenue series |
| `ink-950` | `#0f1319` | Sidebar surface |

The sidebar (`ink-950`) is the second neutral layer — a darker panel against the light content surface. This is the only inverted region in the product.

### Brand — green

`brand-500 #1fa270` is the anchor. `brand-600/700` for text on light, `brand-50/100` for tinted fills, `brand-400` for accents on the dark sidebar.

Green means *profit, on-target, good*. It is never decorative.

### Semantic state

Defined once in `TONES` (`src/lib/palette.js`) as a `{ text, bg, border, dot }` set per tone: `success`/`brand` (green), `warning` (amber), `danger` (red), `info` (blue), `neutral` (ink). Every badge, progress bar and severity dot draws from this map. Do not hand-roll a state colour at the call site.

### Data-viz meaning

One colour, one meaning, product-wide (`COLORS`):

revenue `#1b212a` · profit `#12825b` · cost `#f97316` · labour `#2563eb` · waste `#dc2626` · variance `#b45309` · opex `#7c3aed` · neutral `#94a3b8`

A series keeps its colour across every page. Category colours (`CATEGORY_COLORS`) and multi-series ordering (`SERIES_COLORS`) are likewise fixed.

## Typography

One family: Inter, falling back to the system stack. No display face, no pairing.

Fixed px scale, not fluid. Product UI is viewed at consistent DPI.

| Role | Size / weight |
|---|---|
| Page title | `text-xl` (20px) semibold, `tracking-tight` |
| Hero metric | `text-2xl`–`text-3xl` semibold, `tracking-tight`, tabular |
| Card title | 15px semibold |
| Body / table cell | 13–14px |
| Label / secondary | 12–13px, `ink-500` |
| Section eyebrow | 13px semibold, uppercase, `tracking-wider`, `ink-500` (`.section-title`) |
| Micro / footnote | 11–12px, `ink-400` |

**All numerals use `.tabular`** (`font-variant-numeric: tabular-nums`). Columns of figures must align; body sets `tnum` plus Inter's `cv02–cv04` alternates globally.

## Elevation and surface

Two levels only.

- `shadow-card` — resting cards and panels. Nearly flat: `0 1px 2px / 0 1px 3px` at 4–6% ink.
- `shadow-pop` — overlays: dropdowns, notification panel.

Radii: `rounded-lg` (8px) for controls, inputs, nav items; `rounded-xl` (12px) for cards and overlays; `rounded-full` for badges, dots, progress tracks.

Borders are `border-ink-200/70` on cards, `border-ink-100` for internal hairlines.

**Cards are not the default container.** Use one when a region is genuinely a separate object with its own header and actions. Never nest a card inside a card. Never build a grid of identical icon-heading-text cards.

## Spacing rhythm

Page: `px-4 py-5` mobile, `px-6 py-6` from `sm`. Vertical stack between major sections: `space-y-6`. Grid gaps: `gap-3` for compact tiles, `gap-4` for card sections.

Card padding: `.card-pad` = `p-4` / `p-5` from `sm`. Card headers: `px-4 py-3` / `px-5`.

Vary it. Identical padding on every element reads as monotony, not system.

## Components

Shared vocabulary in `src/components/ui/Primitives.jsx` — `Card`, `CardHeader`, `Badge`, `Delta`, `ProgressBar`, `Segmented`, `StatRow`, `SectionTitle`, `EmptyState`, `Skeleton`. Never re-implement one of these inline.

- **Buttons**: `.btn-primary` (ink-900 fill), `.btn-ghost` (white, ink-200 border), `.btn-sm` for toolbar density. One shape everywhere: `rounded-lg`, `gap-2`, icon at 14–16px.
- **Icons**: lucide-react only, `size` 13–17, `strokeWidth` 1.9–2 for nav. No mixed icon sets.
- **Inputs**: `.input` — ink-200 border, focus ring `ink-900/5` with an `ink-400` border. Same control vocabulary in every form.
- **Delta**: direction-aware; `goodWhenUp={false}` flips the colour for cost metrics. Renders "— no prior data" rather than a fake zero.
- **Empty states teach.** They say what would appear here and what to do, never "No data".

Every interactive element needs default, hover, focus, active and disabled. Focus is a visible ring, never `outline: none` alone.

## Layout

- Fixed sidebar 248px from `lg`, off-canvas with a scrim below it.
- Sticky top bar holds the two global controls — outlet scope and date range — plus notifications and profile. Global controls stay in one place and never repeat inside a page.
- Content max width is unconstrained; tables are allowed to be dense and wide, with horizontal scroll owned by the table.
- Responsive behaviour is structural: collapse the sidebar, reflow grid columns, let tables scroll. Typography does not scale fluidly.
- `.no-print` on chrome, `.print-full` on content — the PDF export is print CSS, not a separate renderer.

## Motion

150–250 ms, ease-out. Motion signals state change only: page enter (`animate-fade-up`, 180 ms), dropdown open, progress fill, hover.

No orchestrated load sequences, no bounce or elastic easing, no animation of layout properties, no decorative movement. The user is mid-task.

## Charts

Hand-built SVG in `src/components/charts/Charts.jsx` — no charting dependency. Grid `ink-100`, axis labels `ink-400` at 11px, values formatted through `src/lib/format.js` (`money`, `moneyShort`, `pct`, `num`) so a figure reads identically in a chart, a table and an export.

Targets render as a dashed neutral line. Series colour always comes from `COLORS`.

## Bans

- Gradient text, `background-clip: text`.
- Coloured left/right side-stripes on cards, rows or alerts.
- Decorative glassmorphism.
- Grids of identical cards used where a list or table is the correct affordance.
- Marketing or positioning copy on a working surface.
- Em dashes in UI copy.
- Repeating the same figure in three places on one screen.
