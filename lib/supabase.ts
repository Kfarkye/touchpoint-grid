import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TouchpointRow } from "@/lib/types";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
}

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNumberOrZero(value: unknown): number {
  const num = toNumberOrNull(value);
  return num ?? 0;
}

function normalizeRow(row: Record<string, unknown>): TouchpointRow {
  return {
    candidate_id: toStringOrEmpty(row.candidate_id),
    nova_id: toNullableString(row.nova_id),
    candidate_name:
      toStringOrEmpty(row.candidate_name) ||
      [toStringOrEmpty(row.first_name), toStringOrEmpty(row.last_name)]
        .filter(Boolean)
        .join(" "),
    first_name: toStringOrEmpty(row.first_name),
    last_name: toStringOrEmpty(row.last_name),
    phone: toStringOrEmpty(row.phone),
    email: toStringOrEmpty(row.email),
    specialty: toStringOrEmpty(row.specialty),
    profession: toStringOrEmpty(row.profession),
    current_facility: toNullableString(row.current_facility),
    current_facility_state: toNullableString(row.current_facility_state),
    assignment_start: toNullableString(row.assignment_start),
    assignment_end: toNullableString(row.assignment_end),
    assignment_status: toNullableString(row.assignment_status),
    has_next_assignment: Boolean(row.has_next_assignment),
    next_facility: toNullableString(row.next_facility),
    next_start: toNullableString(row.next_start),
    next_end: toNullableString(row.next_end),
    last_touch_date: toNullableString(row.last_touch_date),
    last_touch_channel: toNullableString(row.last_touch_channel),
    days_since_touch: toNumberOrZero(row.days_since_touch),
    days_to_end: toNumberOrNull(row.days_to_end),
    week_of_contract: toNumberOrNull(row.week_of_contract),
    weeks_remaining: toNumberOrNull(row.weeks_remaining),
    next_week_of_contract: toNumberOrNull(row.next_week_of_contract),
    bucket: toStringOrEmpty(row.bucket) as TouchpointRow["bucket"],
    priority_level: toStringOrEmpty(row.priority_level) as TouchpointRow["priority_level"],
    priority_score: toNumberOrZero(row.priority_score),
    suggested_action: toStringOrEmpty(row.suggested_action),
  };
}

export async function fetchTouchpointRows(): Promise<TouchpointRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_touchpoint_grid");

  if (error) {
    throw new Error(error.message);
  }

  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => normalizeRow(row as Record<string, unknown>));
}
