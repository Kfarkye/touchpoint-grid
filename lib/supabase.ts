import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TouchpointRow } from "@/lib/types";

let supabaseClient: SupabaseClient | null = null;

export type TouchChannel = "phone" | "text" | "email";
export type TouchOutcome = "connected" | "voicemail" | "no_answer";

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "This board is not connected yet. Check the deployment settings and refresh."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export async function fetchTouchpointGrid(): Promise<TouchpointRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_touchpoint_grid");

  if (error) {
    console.error("Unable to load follow-up list", error);
    throw new Error("We couldn't load your follow-up list right now. Please refresh.");
  }

  const rows = (data ?? []) as TouchpointRow[];
  return rows.map((row) => ({
    ...row,
    phone: row.phone ?? "",
    email: row.email ?? "",
    is_snoozed: Boolean(row.is_snoozed),
    next_touch_due: row.next_touch_due ?? null,
    followup_reason: row.followup_reason ?? null,
  }));
}

export async function logTouch(params: {
  candidateId: string;
  channel: TouchChannel;
  outcome: TouchOutcome;
  note?: string;
  direction?: "outbound" | "inbound";
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("log_touch", {
    p_candidate_id: params.candidateId,
    p_channel: params.channel,
    p_direction: params.direction ?? "outbound",
    p_outcome: params.outcome,
    p_note: params.note?.trim() ? params.note.trim() : null,
  });

  if (error) {
    console.error("Unable to save touch log", error);
    throw new Error("We couldn't save that touch. Try again in a moment.");
  }
}

export async function snoozeCandidate(params: {
  candidateId: string;
  dueDate: string;
  reason: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("set_followup", {
    p_candidate_id: params.candidateId,
    p_due_date: params.dueDate,
    p_reason: params.reason,
  });

  if (error) {
    console.error("Unable to snooze candidate", error);
    throw new Error("We couldn't set that follow-up date. Try again.");
  }
}

export async function unsnoozeCandidate(candidateId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("update_candidate_field", {
    p_candidate_id: candidateId,
    p_field: "next_touch_due",
    p_value: null,
  });

  if (error) {
    console.error("Unable to clear follow-up date", error);
    throw new Error("We couldn't clear that snooze. Try again.");
  }
}
