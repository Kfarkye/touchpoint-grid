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
      "Board setup is incomplete for this deployment. Add Supabase URL and anon key in Vercel Project Settings, then redeploy."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export async function fetchTouchpointGrid(): Promise<TouchpointRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_touchpoint_grid");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TouchpointRow[];
  return rows.map((row) => ({
    ...row,
    phone: row.phone ?? "",
    email: row.email ?? "",
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
    throw new Error(error.message);
  }
}
