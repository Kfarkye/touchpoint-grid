# Touchpoint Priority Grid

Recruiter command center that ranks clinicians by outreach urgency using contract lifecycle + touch recency. One-click routing into RingCentral, email, and Nova.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase anon key
npm run dev
```

## Vercel Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://hixjxztrblfjbwavyyph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

---

## Architecture

```
Supabase RPC (get_touchpoint_grid) — SECURITY DEFINER, bypasses RLS
  → candidates LEFT JOIN assignments LEFT JOIN contact_log LEFT JOIN notes
  → lifecycle priority curve computed in SQL
  → returns 29 columns including email, phone, nova_id

Next.js 15 Client (App Router)
  → supabase.rpc('get_touchpoint_grid')
  → TanStack Table v8 (client-side sort/filter — sub-100 rows)
  → Tailwind CSS dark theme
```

## Lifecycle Priority Curve

| Contract Phase | Priority | Touch Cadence |
|---|---|---|
| Signed next, weeks 1-7 | Low | Bi-weekly |
| Signed next, week 8+ | Medium | Weekly |
| No next, 45+ days left | Standard | Bi-weekly |
| No next, 30-45 days left | Medium | Weekly |
| No next, 14-30 days left | High | 2x/week |
| No next, under 14 days left | Critical | Daily |
| Assignment ended, nothing signed | Critical | Immediate |

---

## Codex Task Spec

All components are already built and wired. Do not rewrite existing files from scratch. Extend them.

### Task 0 — Build Verification
- Run `npm install && npm run build`
- Fix any TypeScript errors
- Add `email: string;` to the `TouchpointRow` interface in `lib/types.ts`
- Verify the page loads data from the Supabase RPC

### Task 1 — Action Column (core workflow integration)

Replace the current text-only "Action" column with an **Actions cell** containing icon buttons per row.

#### 1a. RingCentral Click-to-Call
- Phone icon button (Lucide `Phone`)
- `href="rcmobile://call?number={e164_phone}"`
- Fallback: `href="tel:{phone}"` for browsers where rcmobile is not registered
- Phone numbers need E.164 normalization: strip non-digits, prepend `1` if 10 digits
- Tooltip: "Call via RingCentral"

#### 1b. RingCentral SMS
- Message icon button (Lucide `MessageSquare`)
- `href="rcmobile://sms?number={e164_phone}"`
- Tooltip: "Text via RingCentral"

#### 1c. One-Click Email
- Mail icon button (Lucide `Mail`)
- `href="mailto:{email}"`
- If email is empty string, show disabled state (opacity-30, no pointer)
- Tooltip: show the actual email address

#### 1d. Copy Phone Number
- Clipboard icon button (Lucide `Copy`)
- `navigator.clipboard.writeText(phone)` on click
- Brief "Copied!" feedback: swap icon to `Check` for 1.5 seconds
- Tooltip: "Copy phone number"

#### 1e. Nova Deep Link
- External link icon button (Lucide `ExternalLink`)
- Opens: `https://nova.ayahealthcare.com/#/candidates/{nova_id}`
- `target="_blank"`
- Only render if `nova_id` is not null
- Tooltip: "Open in Nova"

#### Action Bar Layout
Horizontal row of 20px icons with 6px gaps. Muted zinc-500 by default, accent on hover. Disabled = opacity-30 + cursor-not-allowed.

#### Phone Normalization Utility
Create new file `lib/phone.ts`:
```ts
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits;
}

export function formatDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return phone;
}
```

### Task 2 — Quick Links Toolbar

Create `components/quick-links.tsx`. Add between Stats Bar and Filter Bar on the page.

Static external links row:

| Label | URL | Notes |
|---|---|---|
| Nova Dashboard | https://nova.ayahealthcare.com/ | Main workspace |
| Pre-Start Board | https://nova.ayahealthcare.com/ | Pre-start candidates |
| Margin Calculator | https://nova.ayahealthcare.com/ | Pay package calc |
| Aya Job Board | https://www.ayahealthcare.com/travel-nursing/jobs | External view |

All open `target="_blank"`. Styled as subtle text links with Lucide icons. Compact row.

### Task 3 — Enhanced Candidate Name Cell

Update the name column cell to show:
- Name as link (clickable to Nova profile via nova_id)
- Specialty in muted text (already done)
- Formatted phone number in monospace below (using `formatDisplay`)
- Email in truncated muted text (full address in tooltip)

### Task 4 — Move Suggested Action to Tooltip

Remove the dedicated Action text column (it takes too much width). Move `suggested_action` to:
- Tooltip on the Priority badge, OR
- Tooltip on the Bucket label
This frees horizontal space for the new Actions icon column.

### Task 5 — CSV Export

Add "Export" button in header (top right, next to Refresh button):
- Client-side CSV from currently filtered/sorted data
- Columns: Name, Phone, Email, Facility, State, End Date, Days Left, Priority, Bucket, Suggested Action
- Filename: `touchpoint-grid-YYYY-MM-DD.csv`
- No server round-trip

### Task 6 — Keyboard Shortcuts
- `Cmd+K` or `Ctrl+K` focuses search input
- `Escape` clears search text and blurs input

### Task 7 — Empty State
When filters yield zero rows, show centered:
- Message: "No candidates match these filters"
- "Clear filters" button resets priorityFilter, bucketFilter, searchQuery

### Task 8 — Responsive Polish
- Horizontal scroll on table at widths below 1280px
- Stats bar: 2-column grid below 768px
- Filter pills already flex-wrap — verify they don't overflow

---

## Design System

- **Theme:** Dark (surface-0 `#09090b` through surface-4 `#27272d`)
- **Accent:** Cyan `#22d3ee`
- **Priority colors:** Red (critical), Orange (high), Yellow (medium), Zinc (standard), Emerald (low)
- **Typography:** System SF Pro stack, DM Sans fallback, DM Mono for data
- **Icons:** Lucide React — already in package.json (`lucide-react`)
- **Aesthetic:** Linear/Vercel clarity. Minimal chrome. Data-dense. Scannable at a glance.

## Project Structure

```
app/
  layout.tsx
  page.tsx
  globals.css
components/
  touchpoint-table.tsx  — main grid with action column
  stats-bar.tsx         — 5 KPI cards
  filter-bar.tsx        — priority/bucket pills + search
  quick-links.tsx       — NEW: external tool links toolbar
lib/
  supabase.ts           — client singleton + fetchTouchpointGrid()
  types.ts              — TypeScript types, priority config, bucket labels
  phone.ts              — NEW: E.164 normalization + display formatting
```

## RPC Column Reference

| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid | PK |
| nova_id | text | For Nova deep links |
| candidate_name | text | First + Last |
| phone | text | Raw from DB, needs normalization |
| email | text | Empty string if null |
| current_facility | text | Active assignment |
| assignment_end | date | Contract end |
| has_next_assignment | boolean | Lifecycle suppression flag |
| days_to_end | integer | Calendar days |
| week_of_contract | integer | Current week number |
| bucket | text | critical_redeploy / redeploy_window / approaching_end / active_working / signed_next / between_assignments / prospect |
| priority_level | text | critical / high / medium / standard / low |
| priority_score | numeric | 0-100 scale |
| suggested_action | text | Plain English next step |
| days_since_touch | integer | Days since last contact or note |
