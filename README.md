# Costwise

Operational intelligence and profitability layer for restaurants and cafés.

**The POS records the business. Costwise understands it.**

Costwise is not a POS. It sits on top of one and turns transactions, recipes, rosters and
purchase orders into: **metrics → problems → financial impact → recommended action**.

Every insight in this MVP is produced by explicit business rules — thresholds, comparisons,
variance calculations and menu-engineering classifications. There is no AI, no LLM and no
black box: the full rule book is printed in **Settings → Alert rules**.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5180
npm run build
npm run preview
```

Stack: React 18, Vite, React Router, Tailwind CSS, lucide-react. Charts are hand-built SVG
components — no charting dependency.

---

## What is in the product

| Section | What it answers |
| --- | --- |
| **Dashboard** | Health score, 8 KPIs vs the previous period, ranked issues with monthly money at stake, revenue vs profit, top items, outlet performance |
| **Profitability** | Revenue and cost breakdowns, full P&L, sales-to-operating-profit waterfall, margin/food/labour trends, profit by day and by outlet |
| **Menu** | Menu-engineering matrix (Stars / Plowhorses / Puzzles / Dogs), per-item margin, recipe cost breakdown, rule-based action per item |
| **Inventory** | Opening → purchases → expected usage → actual usage → variance, cost of the gap, stock health flags, waste log |
| **Labor** | Labour cost %, sales per labour hour, overtime, day-part heat map of staffing vs demand, per-employee cost |
| **Purchasing** | Supplier spend, price movement vs the previous period, price history, potential savings from cheaper quotes on file |
| **Reports** | 9 export-ready reports with CSV and PDF output, filterable by date, outlet, category and supplier |
| **Settings** | Company, tax, alert thresholds, per-outlet targets, minimum stock levels, users and roles |

Outlet scope (**All outlets** or a single branch) and the date range are global — set them once
in the top bar and every page, chart, alert and export follows.

---

## How the numbers work

```
Net sales      = gross sales − discounts − refunds
Food cost      = recipe cost of items sold + waste + unexplained stock variance
Gross profit   = net sales − food cost
Operating cost = labour + rent + utilities + marketing + delivery commission + other
Operating profit = gross profit − operating cost
```

The distinction that drives most of the product:

- **Theoretical usage** — what the recipes say the sales should have consumed.
- **Actual usage** — what the stock movement says was really consumed.
- **Variance** — the difference that recorded waste does not explain. That gap is over-portioning,
  yield loss, unrecorded waste or theft, and it is priced at the current unit cost.

Comparisons always use the **same-length window immediately before** the selected period.

---

## Architecture

```
src/
  data/
    catalog.js     Master data: company, outlets, users, employees, suppliers,
                   ingredients, menu items + recipes, supplier quotes
    demoData.js    Deterministic generated history (210 days): sales, ingredient
                   usage, waste, purchase orders, stock balances, rosters, expenses
  lib/
    metrics.js     Aggregation engine — every page reads its numbers from here
    rules.js       Alert engine, health score and the published rule book
    date.js        'YYYY-MM-DD' date helpers and period comparison
    format.js      RM currency, percentages, deltas
    exporters.js   CSV writer + print-to-PDF
    palette.js     One colour meaning per concept
    rng.js         Seeded PRNG — the demo data is identical on every reload
  hooks/           usePeriod / useMenu / useInventory / useLabor / usePurchasing
  state/           AppContext: outlet scope, date range, thresholds, alerts
  components/      layout · ui (Card, KpiCard, DataTable, Badge…) · charts · alerts
  pages/           One file per section
```

**Data model** — Company, Outlet, User, Employee, Menu Item, Recipe, Ingredient, Supplier,
Supplier Quote, Purchase Order, Purchase Item, Sales Item, Sales Day, Inventory Level,
Inventory Usage, Waste Record, Labor Record, Operating Expense, Alert.

**Connecting a real POS** later means replacing the generated arrays in `demoData.js`
(`salesItems`, `salesDaily`, `laborRecords`, `purchaseOrders`, `wasteRecords`, `stockLevels`)
with connector output. `metrics.js` and every page above it stay unchanged.

---

## Demo data

Bean & Co., a four-outlet Malaysian café group — KLCC, Subang, PJ, Shah Alam — with 210 days
of trading history, 29 menu items, 44 ingredients, 7 suppliers and 28 employees.

Calibrated to a realistic operator: ~RM53k net sales a week, RM19 average order value,
34% food cost against a 32% target, 18% labour cost, and roughly RM13k a month of recoverable
losses spread across stock variance, waste, supplier price rises and low-margin volume items.

Deliberate, findable problems live in the data: chicken breast usage runs above recipe at KLCC,
poultry and coffee prices stepped up in the last week, PJ carries the group's worst margin,
and several ingredients have a cheaper quote sitting unused on file.

Settings changes (thresholds, outlet targets, company details) persist to `localStorage`.
