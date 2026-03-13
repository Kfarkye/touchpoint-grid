# Touchpoint Priority Grid

Recruiter-facing operational grid that ranks clinicians by outreach urgency using contract lifecycle position + touch recency. Built on Next.js 15 + Vercel + Supabase.

## Architecture

```
Supabase RPC (get_touchpoint_grid)
  → candidates LEFT JOIN assignments LEFT JOIN contact_log LEFT JOIN notes
  → lifecycle priority curve computed in SQL
  → returns ranked rows with bucket, priority_level, priority_score, suggested_action

Next.js Client
  → supabase.rpc('get_touchpoint_grid')
  → TanStack Table (client-side sort/filter — <100 rows)
  → Tailwind CSS dark theme
```

## Data Flow

- **78 candidates** in Supabase, **119 assignments** (61 active, 22 pending_start)
- **11 candidates** have next contract signed → lifecycle suppression active
- RPC computes all derived fields server-side, client only sorts/filters

## Lifecycle Priority Curve

| Contract Phase | Priority | Touch Cadence |
|---|---|---|
| Signed next, weeks 1–7 | Low | Bi-weekly |
| Signed next, week 8+ | Medium | Weekly |
| No next, 45+ days left | Standard | Bi-weekly |
| No next, 30–45 days left | Medium | Weekly |
| No next, 14–30 days left | High | 2x/week |
| No next, <14 days left | Critical | Daily |
| Assignment ended, nothing signed | Critical | Immediate |

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add Supabase anon key to .env.local
npm run dev
```

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://hixjxztrblfjbwavyyph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Project Structure

```
app/
  layout.tsx          — root layout, font loading, metadata
  page.tsx            — main page, data fetching, filter state
  globals.css         — tailwind base + custom component classes
components/
  touchpoint-table.tsx — TanStack Table grid with all column defs
  stats-bar.tsx       — top KPI cards (critical, high, needs touch, etc.)
  filter-bar.tsx      — priority pills, bucket pills, search input
lib/
  supabase.ts         — client singleton + RPC fetch function
  types.ts            — TypeScript types, priority config, bucket labels
```

## Supabase RPC Reference

**Function:** `get_touchpoint_grid()`
**Returns:** Table with columns:

| Column | Type | Description |
|---|---|---|
| candidate_id | uuid | Primary key |
| nova_id | text | Nova VMS ID |
| candidate_name | text | First + Last |
| phone | text | Contact number |
| specialty | text | e.g. Respiratory Therapy |
| current_facility | text | Active assignment facility |
| assignment_end | date | Current contract end date |
| has_next_assignment | boolean | Lifecycle suppression flag |
| next_facility | text | Signed next facility name |
| days_to_end | integer | Calendar days to assignment end |
| week_of_contract | integer | Current week number |
| weeks_remaining | numeric | Weeks until end |
| bucket | text | Classification bucket |
| priority_level | text | critical/high/medium/standard/low |
| priority_score | numeric | 0–100, higher = more urgent |
| suggested_action | text | Plain English next step |
| days_since_touch | integer | Days since last contact_log or note |

## Design System

- **Theme:** Dark (surface-0 through surface-4)
- **Accent:** Cyan (#22d3ee) — matches The Drip internal tools
- **Priority colors:** Red (critical), Orange (high), Yellow (medium), Zinc (standard), Emerald (low)
- **Typography:** System SF Pro stack with DM Sans fallback, monospace for data
- **Aesthetic:** Linear/Vercel clarity — minimal chrome, data-dense, scannable

## Codex Refinement Tasks

1. Verify `npm run build` succeeds with zero errors
2. Add keyboard shortcut (Cmd+K) for search focus
3. Add click-to-copy on phone number cells
4. Add row expansion for full suggested_action + notes preview
5. Add CSV export button (client-side, no server needed)
6. Add column visibility toggle (hide/show columns)
7. Test responsive layout at 1280px and 1440px breakpoints
8. Add empty state illustration when filters return zero rows
