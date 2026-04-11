import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreatePinInput, Pin } from "@/types/pins";
import { sortPinsNewestFirst } from "@/lib/pins/sort";

const PINS_TABLE = "pins";

export async function fetchPins(client: SupabaseClient, userId: string): Promise<Pin[]> {
  const { data, error } = await client
    .from(PINS_TABLE)
    .select("id, user_id, title, note, latitude, longitude, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load pins.");
  }

  return sortPinsNewestFirst((data ?? []) as Pin[]);
}

export async function createPin(
  client: SupabaseClient,
  userId: string,
  input: CreatePinInput,
): Promise<Pin> {
  const { data, error } = await client
    .from(PINS_TABLE)
    .insert({
      user_id: userId,
      title: input.title.trim(),
      note: input.note?.trim() || null,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .select("id, user_id, title, note, latitude, longitude, created_at")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to save pin.");
  }

  return data as Pin;
}
