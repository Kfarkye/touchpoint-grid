# Touchpoint Priority Grid

Recruiter command center that ranks clinicians by outreach urgency using contract lifecycle + touch recency. One-click routing into RingCentral, email, and Nova.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Add Supabase anon key
npm run dev
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hixjxztrblfjbwavyyph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Payload-First Architecture

The app is now contract-driven:

- Canonical HTML URL: `/`
- Canonical JSON URL: `/api/payload/recruiter-command-board`
- Canonical object id: `recruiter-command-board`
- Core rule: both HTML and JSON are generated from the same normalized payload object

Flow:

```text
Supabase RPC (get_touchpoint_grid)
  -> lib/supabase.ts (normalized row fetcher)
  -> lib/payload-builder.ts (single canonical payload builder)
  -> app/page.tsx (HTML render from payload)
  -> app/api/payload/recruiter-command-board/route.ts (JSON render from same payload)
```

## Render Contract

Section order is deterministic and encoded in payload:

1. `hero`
2. `stats`
3. `quick_links`
4. `filters`
5. `table`
6. `footer`

All user-facing labels used by these sections are defined in the payload contract (`lib/payload-contract.ts` + `lib/payload-builder.ts`) and consumed by components.

## Null/Empty Rules

Null and empty handling is explicit in payload (`null_policy`):

- missing phone -> `Phone not listed`
- missing email -> `Email not listed`
- generic missing value -> `—`
- no next assignment text -> `Open to next assignment`

## Canonical Files

```text
app/
  page.tsx                                         # server render from payload builder
  api/payload/recruiter-command-board/route.ts     # machine-readable payload endpoint
components/
  touchpoint-board.tsx                             # canonical renderer (section-order driven)
  touchpoint-table.tsx
  filter-bar.tsx
  stats-bar.tsx
  quick-links.tsx
lib/
  payload-contract.ts                              # payload schema + section/order contracts
  payload-builder.ts                               # single source-of-truth builder
  supabase.ts                                      # normalized fetcher used only by builder
  types.ts                                         # row domain types
  phone.ts
```

## Build Validation

```bash
npm run build
```

Current expected routes:

- `ƒ /`
- `ƒ /api/payload/recruiter-command-board`

## RPC Column Reference

| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid | PK |
| nova_id | text | For Nova deep links |
| candidate_name | text | First + Last |
| phone | text | Raw from DB, normalized for actions |
| email | text | Empty string if null |
| current_facility | text | Active assignment |
| assignment_end | date | Contract end |
| has_next_assignment | boolean | Lifecycle suppression flag |
| days_to_end | integer | Calendar days |
| week_of_contract | integer | Current week number |
| bucket | text | `critical_redeploy` / `redeploy_window` / `approaching_end` / `active_working` / `signed_next` / `between_assignments` / `prospect` |
| priority_level | text | `critical` / `high` / `medium` / `standard` / `low` |
| priority_score | numeric | 0-100 scale |
| suggested_action | text | Plain-English next step |
| days_since_touch | integer | Days since last contact or note |
