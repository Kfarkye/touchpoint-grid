import type { KnownBucket, KnownPriorityLevel, TouchpointRow } from "@/lib/types";

export const PAYLOAD_OBJECT = "touchpoint_board" as const;
export const PAYLOAD_ID = "recruiter-command-board" as const;
export const PAYLOAD_URL = "/" as const;
export const PAYLOAD_API_VERSION = "v1" as const;
export const BOARD_TITLE = "Recruiter Command Board" as const;
export const BOARD_BADGE = "Live Slate" as const;
export const BOARD_PAGE_TITLE = "Candidate Follow-Up Board" as const;
export const BOARD_PAGE_DESCRIPTION =
  "Prioritized follow-up queue based on contract timing and outreach recency." as const;

export type SectionKey =
  | "hero"
  | "stats"
  | "quick_links"
  | "filters"
  | "table"
  | "footer";

export const SECTION_ORDER: readonly SectionKey[] = [
  "hero",
  "stats",
  "quick_links",
  "filters",
  "table",
  "footer",
];

export type TableColumnId =
  | "priority"
  | "score"
  | "name"
  | "facility"
  | "days_to_end"
  | "weeks"
  | "lifecycle"
  | "touch"
  | "bucket"
  | "actions";

export type SortLabelId =
  | "priority"
  | "score"
  | "name"
  | "facility"
  | "days_to_end"
  | "weeks"
  | "lifecycle"
  | "touch"
  | "bucket";

export type StatCardId =
  | "critical"
  | "high"
  | "needs_touch"
  | "signed_next"
  | "total";

export type QuickLinkIcon = "dashboard" | "briefcase" | "calculator" | "external";

export interface FilterOption {
  key: "all" | KnownPriorityLevel | KnownBucket | string;
  label: string;
}

export interface StatCardContract {
  id: StatCardId;
  label: string;
  sub_label?: string;
  tone: KnownPriorityLevel | "neutral";
}

export interface QuickLinkContract {
  id: string;
  label: string;
  href: string;
  icon: QuickLinkIcon;
}

export interface TableColumnContract {
  id: TableColumnId;
  label: string;
  sortable: boolean;
}

export interface TouchpointBoardPayload {
  object: typeof PAYLOAD_OBJECT;
  id: typeof PAYLOAD_ID;
  url: typeof PAYLOAD_URL;
  resource: {
    html_url: string;
    json_url: string;
  };
  api_version: typeof PAYLOAD_API_VERSION;
  generated_at: string;
  section_order: readonly SectionKey[];
  null_policy: {
    value_placeholder: string;
    missing_phone: string;
    missing_email: string;
    missing_specialty: string;
    missing_next_assignment: string;
    booked_next_assignment: string;
  };
  semantics: {
    color_meaning: Record<KnownPriorityLevel | "neutral", string>;
    priority: Record<
      string,
      {
        label: string;
        tone: KnownPriorityLevel | "neutral";
        badge_meaning: string;
      }
    >;
    bucket: Record<
      string,
      {
        label: string;
        badge_meaning: string;
      }
    >;
    priority_fallback: {
      label: string;
      tone: "neutral";
      badge_meaning: string;
    };
    bucket_fallback: {
      label: string;
      badge_meaning: string;
    };
  };
  sections: {
    hero: {
      board_title: string;
      board_badge: string;
      page_title: string;
      page_subtitle: string;
      chips: Array<{
        id: "in_view" | "critical_follow_up";
        label: string;
        value: number;
      }>;
      actions: {
        export_label: string;
        sync_label: string;
        syncing_label: string;
        export_filename_prefix: string;
        last_sync_label: string;
      };
    };
    stats: {
      cards: StatCardContract[];
      values: Record<StatCardId, number>;
      loading_value_label: string;
    };
    quick_links: {
      title: string;
      links: QuickLinkContract[];
    };
    filters: {
      priority_label: string;
      stage_label: string;
      search_placeholder: string;
      clear_search_label: string;
      clear_filters_label: string;
      priority_options: FilterOption[];
      bucket_options: FilterOption[];
      count_labels: {
        all: string;
        filtered: string;
      };
      empty_state_message: string;
    };
    table: {
      columns: TableColumnContract[];
      sort_labels: Record<SortLabelId, string>;
      footer_count_label: string;
      footer_order_label: string;
      sort_direction_desc_label: string;
      sort_direction_asc_label: string;
      default_sort_label: string;
      loading_label: string;
      days_ago_suffix: string;
      days_over_suffix: string;
      export_columns: string[];
      nova_candidate_url_base: string;
      row_actions: {
        call_title: string;
        text_title: string;
        email_fallback_title: string;
        copy_title: string;
        copied_title: string;
        nova_title: string;
      };
    };
    footer: {
      baseline_label: string;
      baseline_value: string;
    };
  };
  rows: TouchpointRow[];
}
