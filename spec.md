# Specification

## Summary
**Goal:** Add two new data-driven charts to the existing Dashboard page — "Repairs by Stage" and "Top Failing Models" — pulling live data from the backend.

**Planned changes:**
- Add a backend query function that aggregates repair tickets by stage, returning a count per stage for all nine stages (Awaiting Parts, Closed, Deployed, Diagnosing, Programming, QA Testing, Ready Deploy, Received, Repairing).
- Add a backend query function that aggregates repair tickets by device model and returns the top failing models sorted by repair count descending.
- Add a `useRepairsByStage` TanStack Query hook that calls the repairs-by-stage backend function.
- Add a `useTopFailingModels` TanStack Query hook that calls the top-failing-models backend function.
- Add a "Repairs by Stage" vertical bar chart (green bars, Recharts BarChart) to DashboardPage, with all nine stage names on the X-axis rotated for readability and repair counts on the Y-axis, wrapped in a titled card with a loading skeleton.
- Add a "Top Failing Models" horizontal bar chart (orange bars, Recharts BarChart layout='vertical') to DashboardPage, with model names on the Y-axis and repair counts on the X-axis, wrapped in a titled card with a loading skeleton.
- Lay out both charts side-by-side in a two-column grid row, positioned below the existing KPI cards and above the recent records tables; stacks vertically on smaller screens.
- Both charts support dark/light mode using existing Tailwind dark mode conventions.

**User-visible outcome:** The dashboard now displays two live charts showing repair distribution across workflow stages and the most frequently repaired device models, giving users an at-a-glance operational overview directly on the dashboard.
