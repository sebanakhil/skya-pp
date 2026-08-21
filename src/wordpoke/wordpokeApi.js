import { supabase } from "../supabaseClient";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function randomCode(length = 4) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

// Creates a room with a fresh random code, retrying on the rare collision.
export async function createRoom(prompt) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { error } = await supabase
      .from("wordpoke_rooms")
      .insert({ code, prompt: prompt || "What's your word?" });
    if (!error) return code;
    if (error.code !== "23505") throw error; // not a duplicate-code collision
  }
  throw new Error("Could not generate a free room code — try again.");
}

export async function fetchRoom(code) {
  const { data, error } = await supabase
    .from("wordpoke_rooms")
    .select("code, prompt, revealed")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchParticipants(code) {
  const { data, error } = await supabase
    .from("wordpoke_participants")
    .select("name, word, joined_at")
    .eq("room_code", code)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Adds the participant if they're new; leaves their existing pinned word alone
// if they're rejoining (e.g. after a refresh).
export async function joinRoom(code, name) {
  const { error } = await supabase
    .from("wordpoke_participants")
    .upsert(
      { room_code: code, name },
      { onConflict: "room_code,name", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function pinWord(code, name, word) {
  const { error } = await supabase
    .from("wordpoke_participants")
    .upsert({ room_code: code, name, word }, { onConflict: "room_code,name" });
  if (error) throw error;
}

export async function revealRoom(code) {
  const { error } = await supabase
    .from("wordpoke_rooms")
    .update({ revealed: true })
    .eq("code", code);
  if (error) throw error;
}

export async function newRound(code) {
  const { error: roomErr } = await supabase
    .from("wordpoke_rooms")
    .update({ revealed: false })
    .eq("code", code);
  if (roomErr) throw roomErr;

  const { error: peopleErr } = await supabase
    .from("wordpoke_participants")
    .update({ word: null })
    .eq("room_code", code);
  if (peopleErr) throw peopleErr;
}

// Subscribes to live changes for a room. Returns an unsubscribe function.
export function subscribeToRoom(code, onChange) {
  const channel = supabase
    .channel(`wordpoke-${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wordpoke_rooms", filter: `code=eq.${code}` },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wordpoke_participants", filter: `room_code=eq.${code}` },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
