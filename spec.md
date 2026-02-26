# Specification

## Summary
**Goal:** Fix dark mode text contrast so all text, labels, values, and headings are clearly visible across all widgets and sections.

**Planned changes:**
- Ensure KPI card text (title, value, description) resolves to high-contrast foreground colors in dark mode
- Fix chart labels, axis text, and legend text visibility in dark mode
- Fix section headings and sub-headings on all pages (Dashboard, Reports, etc.) in dark mode
- Fix table cell text, column headers, and filter label visibility in dark mode
- Fix badge and status label text contrast in dark mode
- Fix sidebar navigation link text and icon visibility in dark mode
- Fix header text (app title, user name, role) visibility in dark mode
- Use only the existing CSS custom property design token system (no hardcoded color values)

**User-visible outcome:** When dark mode is enabled, all text throughout the application — including widgets, cards, charts, tables, badges, sidebar, and headers — is clearly readable with proper contrast against dark backgrounds.
