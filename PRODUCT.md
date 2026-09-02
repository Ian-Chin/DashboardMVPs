# Costwise — Product context

## Register

`product`

Design serves the task. Costwise is an authenticated operations tool, not a marketing surface. The interface should disappear into the job: find the money leak, understand what it costs, act on it.

## Product purpose

Operational intelligence and profitability layer for restaurants and cafés. Costwise is not a POS — it sits on top of one and turns transactions, recipes, rosters and purchase orders into a chain:

**metric → problem → financial impact → recommended action**

Every insight is produced by explicit, published business rules (thresholds, period comparisons, variance calculations, menu-engineering classification). No AI, no black box. The full rule book is printed in Settings → Alert rules.

The distinction that drives the product: *theoretical usage* (what recipes say sales should have consumed) vs *actual usage* (what stock movement says was consumed). The unexplained gap is variance — over-portioning, yield loss, unrecorded waste, theft — priced at current unit cost.

## Users

**Primary: the owner-operator / group manager.** Runs one to six outlets. Financially literate but not an accountant. Opens Costwise between shifts, on a laptop in a bright back office or on a phone on the floor. Has five minutes, not fifty. Wants one question answered: *is anything bleeding money right now, and what do I do about it?*

**Secondary: the outlet manager.** Scoped to one branch. Cares about food cost %, labour cost %, waste and stock variance for their site. Judged on those numbers.

**Tertiary: the finance/admin user.** Pulls the CSV and PDF exports, sets thresholds and outlet targets.

Nobody here is a data analyst. Nobody wants to build a query. The product must have already done the thinking.

## Physical scene

A café group owner, mid-afternoon, laptop open on a stainless prep table under bright overhead light, phone buzzing, twelve minutes between the lunch close and the dinner prep. Sometimes the same check on a phone, one-handed, standing.

Bright ambient light, short attention, interrupted reading. **Light theme.** A dark UI here would be an aesthetic pose, not a fit.

## Tone

Plain operator English, never finance jargon and never startup breeze. Numbers first, then the sentence that explains them, then the instruction.

- "Chicken breast usage is 8.2% above recipe at KLCC. RM 1,840 a month."
- Not "Optimize your protein yield efficiency."
- Not "Uh oh! Looks like something needs your attention 👀"

Every alert ends in an imperative the user can actually perform today.

Malaysian context: RM currency, "labour" not "labor" in copy, outlets not locations.

## Strategic principles

1. **One answer above the fold.** The first screen states whether the business is fine and what the single biggest leak costs. Everything else is a drill-down.
2. **Money is the unit of severity.** Rank by RM at stake, not by alphabetical order, not by metric type. A 3-point food cost miss that costs RM 400 ranks below a variance that costs RM 2,100.
3. **Every number is traceable.** The user can always get from a headline figure to the rule that produced it and the transactions underneath. Trust is the product.
4. **Density is earned, not default.** Show the four numbers that drive a decision. Put the other twenty one interaction away. A wall of equal-weight metrics is the same as no metrics.
5. **Global scope, set once.** Outlet and date range live in the top bar and every page, chart, alert and export obeys them. The user never re-picks a period.
6. **No estimates presented as facts.** Where a figure is derived or partial, say so inline.

## Anti-references

- **The generic SaaS analytics dashboard.** Twelve identical KPI tiles, each with a sparkline and a coloured delta, none ranked, none actionable. This is the failure mode Costwise exists to replace.
- **Executive vanity dashboards.** Big gradient hero number, no instruction attached.
- **Accounting software.** Ledger-grade completeness with zero opinion about what matters.
- **Consumer-fintech gloss.** Confetti, mascots, celebratory copy over someone's payroll.
- **Marketing copy inside the app.** Product-positioning banners on a working surface. Positioning belongs on the site, not in the tool.

## Non-goals

- No AI/LLM features or "insights" the user cannot audit.
- No configuration-first experience. Sensible thresholds ship as defaults.
- No feature that requires the user to already know which metric is broken.
