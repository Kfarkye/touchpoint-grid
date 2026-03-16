# Recruiter Follow-Up Desk (Touchpoint Grid)

Recruiter workflow grid that ranks clinicians by outreach urgency using contract timing + touch recency.

## Current Product State

- Full-width desktop rail (reduced side whitespace)
- Daylight visual system (warm neutral background, low-chrome UI)
- Dense table optimized for fast recruiter scanning
- One-click row actions:
  - RingCentral call: `rcmobile://call?number={e164}`
  - RingCentral text: `rcmobile://sms?number={e164}`
  - Email draft: `mailto:{email}`
  - Copy phone to clipboard
  - Open Nova profile:
    - `https://nova.ayahealthcare.com/#/recruiting/candidates/{nova_id}/new-profile/about`
- Inline write-back:
  - `log_touch` RPC from row-level log panel
  - `set_followup` RPC from row-level snooze panel
  - `update_candidate_field` RPC for unsnooze
- Export currently visible list to CSV
- Keyboard shortcuts:
  - `Cmd+K` / `Ctrl+K` focus search
  - `Esc` clears search and blurs input

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# add your Supabase values
npm run dev
```

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hixjxztrblfjbwavyyph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Stack

- Next.js 15 (App Router, client-side page)
- React 19
- TanStack Table v8
- Supabase JS v2 (`get_touchpoint_grid`, `log_touch`)
- Supabase SQL migration tracked in repo (`set_followup`)
- Tailwind CSS + Lucide icons

## Data Flow

1. `fetchTouchpointGrid()` calls Supabase RPC `get_touchpoint_grid`
2. Rows are normalized client-side (`phone`, `email` fallback to empty string)
3. Client applies search + filters + sort
4. Table renders prioritized list with row-level actions
5. `logTouch()` calls Supabase RPC `log_touch`
6. `snoozeCandidate()` calls Supabase RPC `set_followup`
7. `unsnoozeCandidate()` calls Supabase RPC `update_candidate_field`
8. On success, grid refreshes and re-ranks

## Table UX

- Suggested action is in tooltip (priority badge / stage context)
- Action column is icon-first to preserve horizontal density
- Horizontal scroll below desktop widths
- Empty state includes clear filter + refresh actions
- Connection state includes a user-friendly retry path

## Theme + Type

- Warm light palette from `tailwind.config.js`
- Typography:
  - Body: Manrope
  - Headlines: Source Serif 4
  - Data: IBM Plex Mono

## File Map

```txt
app/
  layout.tsx                 # metadata + font setup
  page.tsx                   # load, filter, export, empty/error states
  globals.css                # global + component utility styles
components/
  touchpoint-table.tsx       # columns, row actions, log panel
  filter-bar.tsx             # search + priority + stage filters
  stats-bar.tsx              # compact KPI strip
  quick-links.tsx            # available, currently not mounted
lib/
  supabase.ts                # Supabase client + RPC helpers
  phone.ts                   # e164 + display formatting + validation
  types.ts                   # row model, labels, priority config
```

## Build Check

```bash
npm run build
```

## Backend Artifacts

- Migration SQL:
  - `supabase/migrations/20260315193000_add_set_followup_rpc.sql`
- Backend task guide:
  - `docs/BACKEND_AGENT_TASK.md`
- Live RPC validation script:
  - `scripts/validate-followup-rpcs.sh`

## Notes

- If Supabase env vars are missing, the UI shows a user-safe connection message.
- This repository includes `PRODUCT_RULES.md` as the copy/design quality floor.
