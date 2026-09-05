# Costwise — Design system

Light, restrained colour, one type family per workspace. Tailwind tokens live in `tailwind.config.js`; component classes and the two token sets in `src/index.css`; data-viz colour meanings in `src/lib/palette.js`.

## Theme

**Light, permanently.** Scene: bright back office / phone on the floor in daylight, short interrupted sessions. Dark mode is not planned; a dim-room premise does not exist for this user.

### Two themes, one token layer

The product carries **two** themes. Everything below describes theme A, the restaurant theme, which is the default. The e-commerce workspace runs theme B; the differences are listed under [E-commerce theme](#e-commerce-theme) at the end of this document.

Neither theme is expressed as literal hex values at a call site. Every `ink-*` and `brand-*` token, both font stacks and both shadow scales resolve through a CSS variable:

```js
// tailwind.config.js
ink: { 900: 'rgb(var(--ink-900) / <alpha-value>)', ... }
```

`:root` in `src/index.css` holds theme A. `[data-theme='ecom']` holds theme B, and the e-commerce shell (`EcomLayout.jsx`, plus `LauncherShell` when passed `theme="ecom"`) puts that attribute on its root node. So `bg-ink-50` means `#f6f7f9` on `/dashboard` and `#f7f7f5` on `/ecommerce/overview`, and no component needs to know which workspace it is rendering in.

Variables hold space-separated RGB channels so Tailwind's opacity modifiers (`bg-ink-900/20`) keep working.

**Do not add a third theme, and do not read a variable directly at a call site.** If a rule differs between the two, express it once as a scoped component class (`[data-theme='ecom'] .section-title { ... }`), never as a conditional in JSX.

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

**Series colour does not fork between themes.** `palette.js` is plain hex, shared by both workspaces, because a colour meaning has to survive a user moving between them. Only surface, text and brand tokens are themed.

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

## Information architecture

**A page shows its own subject and nothing else.** Every page in both workspaces owns one subject, and no page reprints a block that is another page's core view. The menu ranking belongs to the menu report; the outlet comparison belongs to the profitability report; the SKU table, the platform table and the returns-reason breakdown belong to the product, marketing and returns reports.

This is not a space saving. A block that exists twice is two things to keep in sync, two places a definition can drift, and a reader who cannot tell which one is authoritative. It also makes the dashboard longer without making it say more.

What an overview legitimately owns:

- **The verdict.** What is wrong, how much it costs, where to go.
- **Headline metrics** for the period, with their comparison.
- **The money statement**, whole. A P&L line naming ad spend or returns is not the marketing page or the returns page; it is the statement being complete.
- **The period trend** and the cross-cutting shape (the funnel, the channel split) that has no page of its own.
- **The alert list**, which is how a reader gets from a symptom to the page that owns it.

When an overview needs to point at a detail page, it points: `CardHeader to="/…"` on a panel the page does own, or a link inside an alert. It does not paste the page in.

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
- Em dashes in UI copy. This includes chart subtitles, alert `action` strings, classification `blurb`/`note` strings in `metrics.js` and `ecomMetrics.js`, and range separators. The lone `—` used as a "no value" glyph in a table cell is the one permitted use.
- Repeating the same figure in three places on one screen.

---

## E-commerce theme

Applied by `data-theme="ecom"`. Everything above still holds except the following. This is a second theme, not a second design system: the same primitives, the same spacing rhythm, the same component vocabulary.

### Neutrals

Hue-free grey with a trace of warmth, replacing the cool slate ramp. Slate competes with the one accent; a true neutral lets green be the only colour carrying meaning.

| Token | Theme A | Theme B |
|---|---|---|
| `ink-50` | `#f6f7f9` | `#f7f7f5` |
| `ink-100` | `#eceef2` | `#eeeeec` |
| `ink-200` | `#d5dae2` | `#dddcd8` |
| `ink-300` | `#b0b9c8` | `#bcbbb7` |
| `ink-400` | `#8492a8` | `#8a8985` |
| `ink-500` | `#64748b` | `#6e6d69` |
| `ink-600` | `#4d5a6e` | `#55544f` |
| `ink-800` | `#2b333f` | `#302f2b` |
| `ink-900` | `#1b212a` | `#1c1b18` |
| `ink-950` | `#0f1319` | `#111110`, unused |

### Brand

Deepened so it holds against the warmer canvas: `brand-500` `#1fa270` becomes `#1f8a63`, `brand-600` `#12825b` becomes `#157050`. Same meaning, same 10%-of-screen ceiling.

### Typography

**Geist**, self-hosted as a variable font through `@fontsource-variable/geist`, with `Geist Mono` for the rare monospaced case. Theme A keeps its original stack, which names Inter and falls back to the system face on machines without it.

`font-feature-settings` drops Inter's `cv02`–`cv04` alternates and keeps `tnum` only.

### Surface

- **Panels rest flat.** `.card` is a 1px `ink-200` border on white with no shadow. Theme A keeps its `shadow-card` lift and its `ink-200/70` border. `shadow-pop` remains the only real elevation in both.
- **A row of KPIs is one panel, not four.** `.kpi-grid` wraps a four-up metric row in a single border with hairline dividers, so the eye reads one block of four. Theme A keeps four separate cards.

### Labels

No uppercase micro-labels. `.section-title`, `.th` and `.chart-label` all switch to sentence case under the scope; the sidebar and dropdown group labels are sentence case at the call site. A small uppercase wide-tracked label above every block is what makes an interface read as templated.

### Layout

- The sidebar is a white surface with `border-r border-ink-200`, active item `bg-ink-100` with a `brand-600` icon. Theme A keeps the `ink-950` panel.
- The workspace menu header (`LauncherShell theme="ecom"`) is light. Theme A keeps the dark hero.
- **No inverted regions inside the workspace.** Once you are in e-commerce, every surface is the same light theme.

### Structure and flow

The page order is the order the questions get asked, and it follows the pattern the category has converged on: an insight first, headline numbers second, the statement third, breakdowns last.

1. **Verdict.** What is leaking, how much, and the one link worth clicking. The equivalent of the insights panel a merchant admin puts above the fold.
2. **Money.** Four headline tiles plus a strip of four secondary ones.
3. **Profit and loss.** The contribution-margin statement, with the waterfall beside it.
4. **Trend.** Revenue and contribution by day, with the sessions-to-orders funnel beside it.
5. **Needs attention.** Full width, because a list of things to fix should not be squeezed into a third of the row.
6. **Channels**, which is the one breakdown with no page of its own.

It stops there. Products, marketing and returns each have a page, so the overview links to them from the alert list rather than reprinting them. See [Information architecture](#information-architecture).

### The comparison control

The period control answers "when". A second control, next to it, answers "against what". Hard-coding the comparison is what leaves a dashboard unable to say whether a dip is a trend or a calendar artefact.

- **Previous period** is the same-length window immediately before. The default.
- **4 weeks earlier** shifts the window back four whole weeks so every day lands on the same weekday and roughly the same point in the month. In a business whose demand is a weekday shape with campaign spikes on double-digit dates, that is the only honest like-for-like short of a full year, which this dataset does not hold.

The chosen comparison drives every delta on the page, the P&L's change column and the reference line inside an expanded tile. It is named in the section header and in the P&L column head, so no figure on the page is a change against an unstated baseline.

### The contribution-margin statement

`ProfitAndLoss` renders `pnlStatement()` as a statement to be read down, not a chart. The order is fixed:

> Gross sales → discounts → returns → **net revenue** → product cost → **gross profit** → channel fees → delivery → return handling → ad spend (split by platform) → **contribution margin**

Every line carries its share of net revenue, because a cost is only legible as a percentage of the revenue it eats. Costs render in parentheses with a `less` prefix and their change column flips sign, so a rising cost is red whichever direction the number moved.

Contribution margin is the last subtotal, and the panel says why: overhead is not in the dataset, so anything below that line would be invented.

### Component conventions

- **The panel heading is the drill-down.** `CardHeader to="/…"` makes the title itself the link into the full report, with a chevron. A separate small "Detail" link in the corner fights the heading for the same job. Use it on a panel this page owns that has a deeper page behind it, never as a way to justify pasting that page in.
- **A tile with a daily series behind it opens.** `KpiCard expandable` swaps the sparkline for the period's days as bars with the comparison period's daily average drawn across them, which answers "trend or one bad Tuesday" without leaving the tile. Opt-in: a tile with no series stays inert, and the restaurant tiles are unchanged.

### Bans, in addition to the list above

- Blurred colour washes, glow blobs, mesh gradients behind any surface.
- Composite scores drawn as decorative dials. A score is a number and a bar, sitting in the same row as the parts that produce it.
