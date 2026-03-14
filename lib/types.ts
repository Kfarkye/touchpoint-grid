export interface TouchpointRow {
  candidate_id: string;
  nova_id: string | null;
  candidate_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  specialty: string;
  profession: string;
  current_facility: string | null;
  current_facility_state: string | null;
  assignment_start: string | null;
  assignment_end: string | null;
  assignment_status: string | null;
  has_next_assignment: boolean;
  next_facility: string | null;
  next_start: string | null;
  next_end: string | null;
  last_touch_date: string | null;
  last_touch_channel: string | null;
  days_since_touch: number;
  days_to_end: number | null;
  week_of_contract: number | null;
  weeks_remaining: number | null;
  next_week_of_contract: number | null;
  bucket: Bucket;
  priority_level: PriorityLevel;
  priority_score: number;
  suggested_action: string;
}

export type PriorityLevel =
  | "critical"
  | "high"
  | "medium"
  | "standard"
  | "low";

export type Bucket =
  | "critical_redeploy"
  | "redeploy_window"
  | "approaching_end"
  | "active_working"
  | "signed_next"
  | "between_assignments"
  | "prospect";

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; color: string; bg: string; ring: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/30",
  },
  high: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/30",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    ring: "ring-yellow-500/30",
  },
  standard: {
    label: "Standard",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-500/30",
  },
  low: {
    label: "Low",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
};

export const BUCKET_LABELS: Record<Bucket, string> = {
  critical_redeploy: "Critical Redeploy",
  redeploy_window: "Redeploy Window",
  approaching_end: "Approaching End",
  active_working: "Active Working",
  signed_next: "Signed Next",
  between_assignments: "Between Assignments",
  prospect: "Prospect",
};
