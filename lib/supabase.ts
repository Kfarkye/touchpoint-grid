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
