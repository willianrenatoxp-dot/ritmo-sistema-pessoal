import type { SupabaseClient } from "@supabase/supabase-js";

export type RitmoPayload<TState> = {
  theme: "light" | "dark";
  state: TState;
};

export async function loadRitmoState<TState>(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("load_ritmo_state");
  if (error) throw error;
  return data as RitmoPayload<TState>;
}

export async function saveRitmoState<TState>(
  supabase: SupabaseClient,
  payload: RitmoPayload<TState>,
) {
  const { error } = await supabase.rpc("save_ritmo_state", { payload });
  if (error) throw error;
}
