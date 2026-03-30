import type {
  FilterOption,
  StatCardContract,
  TableColumnContract,
  TouchpointBoardPayload,
} from "@/lib/payload-contract";
import {
  BOARD_BADGE,
  BOARD_PAGE_DESCRIPTION,
  BOARD_PAGE_TITLE,
  BOARD_TITLE,
  PAYLOAD_API_VERSION,
  PAYLOAD_ID,
  PAYLOAD_OBJECT,
  PAYLOAD_URL,
  SECTION_ORDER,
} from "@/lib/payload-contract";
import { fetchTouchpointRows } from "@/lib/supabase";
import type { KnownPriorityLevel, TouchpointRow } from "@/lib/types";

const PRIORITY_RANK: Record<KnownPriorityLevel, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  standard: 2,
  low: 1,
};

const PRIORITY_SEMANTICS: Record<
  KnownPriorityLevel,
  {
    label: string;
    tone: KnownPriorityLevel;
    badge_meaning: string;
  }
> = {
  critical: {
    label: "Critical",
    tone: "critical",
    badge_meaning: "Requires immediate outreach.",
  },
  high: {
    label: "High",
    tone: "high",
    badge_meaning: "Requires follow-up this week.",
  },
  medium: {
    label: "Medium",
    tone: "medium",
    badge_meaning: "Requires scheduled outreach.",
  },
  standard: {
    label: "Standard",
    tone: "standard",
    badge_meaning: "Stable cadence is sufficient.",
  },
  low: {
    label: "Low",
    tone: "low",
    badge_meaning: "Monitor and maintain cadence.",
  },
};

const BUCKET_SEMANTICS: Record<
  string,
  {
    label: string;
    badge_meaning: string;
  }
> = {
  critical_redeploy: {
    label: "Critical Redeploy",
    badge_meaning: "Assignment ended and no next assignment is signed.",
  },
  redeploy_window: {
    label: "Redeploy Window",
    badge_meaning: "Inside the redeploy window with no signed next assignment.",
  },
  approaching_end: {
    label: "Approaching End",
    badge_meaning: "Contract is approaching completion.",
  },
  active_working: {
    label: "Active Working",
    badge_meaning: "In assignment with runway remaining.",
  },
  signed_next: {
    label: "Signed Next",
    badge_meaning: "Next assignment is already signed.",
  },
  between_assignments: {
    label: "Between Assignments",
    badge_meaning: "Open and between active assignments.",
  },
  prospect: {
    label: "Prospect",
    badge_meaning: "Prospective clinician not yet in assignment.",
  },
};

const PRIORITY_OPTIONS: FilterOption[] = [
  { key: "all", label: "All Levels" },
  { key: "critical", label: PRIORITY_SEMANTICS.critical.label },
  { key: "high", label: PRIORITY_SEMANTICS.high.label },
  { key: "medium", label: PRIORITY_SEMANTICS.medium.label },
  { key: "standard", label: PRIORITY_SEMANTICS.standard.label },
  { key: "low", label: PRIORITY_SEMANTICS.low.label },
];

const BUCKET_OPTIONS: FilterOption[] = [
  { key: "all", label: "All Stages" },
  { key: "critical_redeploy", label: BUCKET_SEMANTICS.critical_redeploy.label },
  { key: "redeploy_window", label: BUCKET_SEMANTICS.redeploy_window.label },
  { key: "approaching_end", label: BUCKET_SEMANTICS.approaching_end.label },
  { key: "active_working", label: BUCKET_SEMANTICS.active_working.label },
  { key: "signed_next", label: BUCKET_SEMANTICS.signed_next.label },
  { key: "between_assignments", label: BUCKET_SEMANTICS.between_assignments.label },
  { key: "prospect", label: BUCKET_SEMANTICS.prospect.label },
];

const STAT_CARDS: StatCardContract[] = [
  {
    id: "critical",
    label: "Immediate Follow-Up",
    tone: "critical",
  },
  {
    id: "high",
    label: "Priority This Week",
    tone: "high",
  },
  {
    id: "needs_touch",
    label: "Overdue Outreach",
    sub_label: "14+ days since touch",
    tone: "medium",
  },
  {
    id: "signed_next",
    label: "Rebooked",
    tone: "low",
  },
  {
    id: "total",
    label: "Active Roster",
    tone: "neutral",
  },
];

const TABLE_COLUMNS: TableColumnContract[] = [
  { id: "priority", label: "Urgency", sortable: true },
  { id: "score", label: "Priority Score", sortable: true },
  { id: "name", label: "Clinician", sortable: true },
  { id: "facility", label: "Facility", sortable: true },
  { id: "days_to_end", label: "Days Left", sortable: true },
  { id: "weeks", label: "Contract Week", sortable: true },
  { id: "lifecycle", label: "Next Placement", sortable: true },
  { id: "touch", label: "Last Outreach", sortable: true },
  { id: "bucket", label: "Workflow Stage", sortable: true },
  { id: "actions", label: "Outreach", sortable: false },
];

const QUICK_LINKS: TouchpointBoardPayload["sections"]["quick_links"]["links"] = [
  {
    id: "nova-workspace",
    label: "Nova Workspace",
    href: "https://nova.ayahealthcare.com/",
    icon: "dashboard",
  },
  {
    id: "prestart-pipeline",
    label: "Pre-Start Pipeline",
    href: "https://nova.ayahealthcare.com/",
    icon: "briefcase",
  },
  {
    id: "margin-calculator",
    label: "Margin Calculator",
    href: "https://nova.ayahealthcare.com/",
    icon: "calculator",
  },
  {
    id: "aya-marketplace",
    label: "Aya Marketplace",
    href: "https://www.ayahealthcare.com/travel-nursing/jobs",
    icon: "external",
  },
];

function sortRowsCanonical(rows: TouchpointRow[]): TouchpointRow[] {
  return [...rows].sort((a, b) => {
    const priorityDelta =
      (PRIORITY_RANK[b.priority_level as KnownPriorityLevel] ?? 0) -
      (PRIORITY_RANK[a.priority_level as KnownPriorityLevel] ?? 0);
    if (priorityDelta !== 0) return priorityDelta;

    const scoreDelta = b.priority_score - a.priority_score;
    if (scoreDelta !== 0) return scoreDelta;

    return a.candidate_name.localeCompare(b.candidate_name);
  });
}

function labelFromSlug(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildStats(rows: TouchpointRow[]): TouchpointBoardPayload["sections"]["stats"]["values"] {
  return {
    total: rows.length,
    critical: rows.filter((row) => row.priority_level === "critical").length,
    high: rows.filter((row) => row.priority_level === "high").length,
    needs_touch: rows.filter((row) => row.days_since_touch > 14).length,
    signed_next: rows.filter((row) => row.has_next_assignment).length,
  };
}

export function buildTouchpointBoardPayload(rows: TouchpointRow[]): TouchpointBoardPayload {
  const canonicalRows = sortRowsCanonical(rows);
  const stats = buildStats(canonicalRows);
  const observedBuckets = Array.from(new Set(canonicalRows.map((row) => row.bucket))).filter(
    Boolean
  );

  const dynamicBucketSemantics = observedBuckets.reduce<Record<string, { label: string; badge_meaning: string }>>(
    (acc, bucket) => {
      if (!acc[bucket]) {
        acc[bucket] = BUCKET_SEMANTICS[bucket] ?? {
          label: labelFromSlug(bucket),
          badge_meaning: "Observed in source data and rendered from payload.",
        };
      }
      return acc;
    },
    { ...BUCKET_SEMANTICS }
  );

  const bucketOptions: FilterOption[] = [
    ...BUCKET_OPTIONS,
    ...observedBuckets
      .filter((bucket) => !BUCKET_OPTIONS.some((option) => option.key === bucket))
      .sort((a, b) => a.localeCompare(b))
      .map((bucket) => ({
        key: bucket,
        label: dynamicBucketSemantics[bucket].label,
      })),
  ];

  return {
    object: PAYLOAD_OBJECT,
    id: PAYLOAD_ID,
    url: PAYLOAD_URL,
    resource: {
      html_url: PAYLOAD_URL,
      json_url: "/api/payload/recruiter-command-board",
    },
    api_version: PAYLOAD_API_VERSION,
    generated_at: new Date().toISOString(),
    section_order: SECTION_ORDER,
    null_policy: {
      value_placeholder: "—",
      missing_phone: "Phone not listed",
      missing_email: "Email not listed",
      missing_specialty: "—",
      missing_next_assignment: "Open to next assignment",
      booked_next_assignment: "Booked",
    },
    semantics: {
      color_meaning: {
        critical: "Red indicates immediate outreach required.",
        high: "Orange indicates outreach due this week.",
        medium: "Yellow indicates cadence risk.",
        standard: "Zinc indicates normal cadence.",
        low: "Green indicates stable coverage.",
        neutral: "Neutral tone indicates non-priority aggregates.",
      },
      priority: PRIORITY_SEMANTICS,
      bucket: dynamicBucketSemantics,
      priority_fallback: {
        label: "Unscored",
        tone: "neutral",
        badge_meaning: "Priority level came from source data outside canonical levels.",
      },
      bucket_fallback: {
        label: "Unknown Stage",
        badge_meaning: "Bucket came from source data outside canonical stages.",
      },
    },
    sections: {
      hero: {
        board_title: BOARD_TITLE,
        board_badge: BOARD_BADGE,
        page_title: BOARD_PAGE_TITLE,
        page_subtitle: BOARD_PAGE_DESCRIPTION,
        chips: [
          {
            id: "in_view",
            label: "in current view",
            value: canonicalRows.length,
          },
          {
            id: "critical_follow_up",
            label: "immediate follow-ups",
            value: stats.critical,
          },
        ],
        actions: {
          export_label: "Export List",
          sync_label: "Sync Roster",
          syncing_label: "Syncing...",
          export_filename_prefix: "touchpoint-grid",
          last_sync_label: "Last sync",
        },
      },
      stats: {
        cards: STAT_CARDS,
        values: stats,
        loading_value_label: "Loading",
      },
      quick_links: {
        title: "Recruiter Shortcuts",
        links: QUICK_LINKS,
      },
      filters: {
        priority_label: "Urgency",
        stage_label: "Stage",
        search_placeholder: "Search clinician, facility, or specialty...",
        clear_search_label: "Clear search",
        clear_filters_label: "Clear filters",
        priority_options: PRIORITY_OPTIONS,
        bucket_options: bucketOptions,
        count_labels: {
          all: "{total} clinicians in view",
          filtered: "{filtered} of {total} clinicians in view",
        },
        empty_state_message: "No candidates match these filters",
      },
      table: {
        columns: TABLE_COLUMNS,
        sort_labels: {
          priority: "urgency",
          score: "priority score",
          name: "clinician",
          facility: "facility",
          days_to_end: "days left",
          weeks: "contract week",
          lifecycle: "next placement",
          touch: "last outreach",
          bucket: "workflow stage",
        },
        footer_count_label: "{count} clinicians in view",
        footer_order_label: "ordered by",
        sort_direction_desc_label: "(high to low)",
        sort_direction_asc_label: "(low to high)",
        default_sort_label: "default urgency",
        loading_label: "Pulling current candidate priorities...",
        days_ago_suffix: "d ago",
        days_over_suffix: "d over",
        export_columns: [
          "Name",
          "Phone",
          "Email",
          "Facility",
          "State",
          "End Date",
          "Days Left",
          "Priority",
          "Bucket",
          "Suggested Action",
        ],
        nova_candidate_url_base:
          "https://nova.ayahealthcare.com/#/recruiting/candidates",
        row_actions: {
          call_title: "Call in RingCentral",
          text_title: "Text in RingCentral",
          email_fallback_title: "No email",
          copy_title: "Copy phone number",
          copied_title: "Copied phone number",
          nova_title: "Open in Nova",
        },
      },
      footer: {
        baseline_label: "Payload Contract",
        baseline_value: "v1 / deterministic render",
      },
    },
    rows: canonicalRows,
  };
}

export async function getTouchpointBoardPayload(): Promise<TouchpointBoardPayload> {
  const rows = await fetchTouchpointRows();
  return buildTouchpointBoardPayload(rows);
}
