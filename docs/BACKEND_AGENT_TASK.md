# Backend Agent Task: Follow-Up Snooze RPC

This repo now includes the backend artifacts for the snooze workflow used in
the recruiter grid.

## Scope

- Add `set_followup` migration SQL to source control
- Keep unsnooze on existing `update_candidate_field` RPC
- Validate write-back behavior against live Supabase

## Files Added

- `supabase/migrations/20260315193000_add_set_followup_rpc.sql`
- `scripts/validate-followup-rpcs.sh`

## What The RPC Does

`set_followup(p_candidate_id uuid, p_due_date date, p_reason text)`:

- Stores follow-up date on `candidates.next_touch_due`
- Stores follow-up reason on `candidates.followup_reason`
- Rejects blank reason and past dates
- Throws clear errors when candidate is missing

## Deploy Steps

1. Open Supabase SQL Editor for project `hixjxztrblfjbwavyyph`.
2. Run:
   - `supabase/migrations/20260315193000_add_set_followup_rpc.sql`
3. Confirm function exists:

```sql
select proname
from pg_proc
where proname = 'set_followup';
```

4. Confirm grid RPC includes these fields:
   - `is_snoozed`
   - `next_touch_due`
   - `followup_reason`

## Validation Script

Run from repo root:

```bash
SUPABASE_URL="https://hixjxztrblfjbwavyyph.supabase.co" \
SUPABASE_ANON_KEY="<anon-key>" \
TEST_CANDIDATE_ID="<candidate-uuid>" \
./scripts/validate-followup-rpcs.sh
```

What it checks:

1. `set_followup` returns success
2. `get_touchpoint_grid` reflects snoozed state
3. `update_candidate_field` clears `next_touch_due`
4. `get_touchpoint_grid` reflects unsnoozed state

If `jq` is installed, the script performs row-level assertions on the selected
candidate. Without `jq`, it still verifies RPC status codes.
