# Budget & Runway Model Template

## Overview
Use this template to manage runway visibility, align stakeholders on growth objectives, and tie updates back to the annual operating plan (AOP). Each section can live on a dedicated sheet or tab in the financial model. Suggested metrics and formulas are included to accelerate setup.

## 1. Summary Sheet
Provide the high-level snapshot for leadership.

| Metric | Description | Example Formula | Notes |
| --- | --- | --- | --- |
| Opening Cash Balance | Starting cash for the period. | `=SUM(Cash_Balances!B2)` | Pull from treasury ledger or last model month. |
| Monthly Net Burn | Operating outflows minus inflows. | `=Total_Expenses - Total_Revenue` | Highlight variance versus plan. |
| Runway (Months) | Months remaining at current burn. | `=IF(Monthly_Net_Burn=0, "∞", Ending_Cash/Monthly_Net_Burn)` | Round to one decimal place. |
| Growth Targets | Key revenue/GMV/ARR goals. | `=INDEX(Goals!B:B, MATCH(Current_Month, Goals!A:A, 0))` | Tie to OKRs or AOP KPIs. |
| Hiring Plan Status | Headcount vs. planned. | `=Actual_FTEs / Planned_FTEs` | Display as percentage. |
| Material Variances | Bullets for deviations. | — | Include top 3 drivers of change. |

Add a KPI gauge or conditional formatting for runway thresholds (e.g., < 9 months = red).

## 2. Revenue Forecast
Break out all revenue streams with assumptions and drivers.

| Stream | Pricing Unit | Volume Driver | Avg. Price | Start Month | Growth Assumption | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Subscription (Core) | Seat | `Active Accounts` | `$` | `Jan-2025` | `Monthly Growth %` | Apply churn and expansion factors. |
| Usage-Based | Compute Hour | `Usage_Forecast!B:B` | `$` | `Feb-2025` | `=Prev_Month * (1 + Growth_Rate)` | Build elasticity scenarios. |
| Services | Project | `Signed Statements` | `$` | `Mar-2025` | `=Pipeline * Win_Rate` | Align with delivery capacity. |

**Assumptions:**
- Document churn, expansion, and seasonality by stream.
- Separate tabs for pipeline conversion and pricing experiments.

## 3. Expense Forecast
Capture all operating expenses with granularity.

### Headcount & People Costs
| Function | Role | Start Date | FTE | Base Salary | Benefits % | Equity/Token Grants | Total Monthly Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTM | AE | `Apr-2025` | `1.0` | `$` | `20%` | `$ Value / Vesting Months` | `=(Base/12)*(1+Benefits%)+Equity` |
| Product | PM | `May-2025` | `1.0` | `$` | `18%` | `$` | `...` |

### Operating & Vendor Spend
| Category | Vendor | Contract Term | Monthly Cost | Renewal Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Infrastructure | Cloud Provider | `Annual` | `$` | `Dec-2025` | `Infra Lead` | Track committed vs. actual usage. |
| Tools | CRM | `Monthly` | `$` | `Rolling` | `RevOps` | Monitor seat creep. |
| Legal & Compliance | Outside Counsel | `Retainer` | `$` | `Jun-2025` | `GC` | Include token grant legal fees. |

Include separate schedule for token grants (grant date, cliff, vesting, accounting expense).

## 4. Scenario Planning
Model base, conservative, and aggressive trajectories.

| Scenario | Revenue Growth | Hiring Pace | Expense Controls | Cash Out Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Base | `Plan` | `Planned` | `Standard` | `Nov-2026` | Aligns with AOP. |
| Conservative | `Plan - 20%` | `Hiring Freeze Q3` | `Reduce Discretionary 15%` | `Jun-2026` | Use for downside protection. |
| Aggressive | `Plan + 25%` | `Accelerated hires` | `Invest in GTM` | `Jan-2027` | Requires incremental funding. |

Use dropdown or named ranges to toggle scenarios that feed summary metrics and cash flow.

## 5. Cash Flow Statement
Track monthly inflows/outflows and ending cash.

| Month | Revenue | Operating Expenses | CapEx | Financing | Net Cash Flow | Ending Cash |
| --- | --- | --- | --- | --- | --- | --- |
| Jan-2025 | `$` | `$` | `$` | `$` | `=Revenue-Operating-CapEx+Financing` | `=Prior_Ending+Net_Cash_Flow` |
| Feb-2025 | `$` | `$` | `$` | `$` | `...` | `...` |

Tie operating expenses back to the detailed expense forecast using SUMIF/SUMPRODUCT on category codes.

## 6. Runway Dashboard
Automate key indicators for leadership dashboards.

- **Runway Remaining:** `=MAX(0, Ending_Cash / Monthly_Net_Burn)`
- **Cash Zero Date:** `=EOMONTH(Start_Date, Runway_Months)`
- **Trigger Alerts:** Conditional formatting when runway < 12, 9, 6 months.
- **Trend Charts:** Plot monthly revenue, expenses, headcount, and burn.
- **Covenant Tracking:** If debt covenants exist, display current vs. required ratios.

Consider embedding charts in BI tools (Looker, Mode) for automated refresh.

## 7. Review & Approval Log
Maintain governance trail tied to AOP.

| Version | Date | Owner | Approver | Summary of Changes | Link to AOP Artifact |
| --- | --- | --- | --- | --- | --- |
| `v2025.01` | `2025-01-15` | `Finance Lead` | `CFO` | `Initial FY25 model baseline.` | `[AOP FY25 v1](...)` |
| `v2025.02` | `2025-02-10` | `Finance Lead` | `CEO` | `Updated GTM hiring and runway.` | `[AOP FY25 v2](...)` |

Capture commentary and sign-off timestamps; sync with change management or Notion/Airtable trackers if used.

## Implementation Checklist
- [ ] Link data sources (bank feeds, ERP, CRM) to automate actuals.
- [ ] Validate formulas for each scenario and summary metric.
- [ ] Schedule monthly variance reviews with functional leaders.
- [ ] Archive finalized versions in the Review & Approval Log.

Adopt this template as the baseline model, then iterate with team-specific requirements or investor reporting needs.
