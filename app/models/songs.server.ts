export async function listApprovedSongsForDate(supabase, date) {
  if (!date) return { data: [], error: null };
  return supabase
    .from("songs")
    .select(
      "id, user_id, youtube_url, youtube_video_id, youtube_title, youtube_thumbnail_url, scheduled_date, slot_number, status",
    )
    .eq("scheduled_date", date)
    .in("status", ["approved", "played"])
    .is("deleted_at", null)
    .order("slot_number", { ascending: true });
}

export async function listSongsForUser(supabase, userId, limit = 10) {
  if (!userId) return { data: [], error: null };
  return supabase
    .from("songs")
    .select(
      "id, user_id, youtube_url, youtube_video_id, youtube_title, youtube_thumbnail_url, scheduled_date, slot_number, status",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function createSongSubmission(supabase, payload) {
  return supabase.from("songs").insert(payload).select().single();
}
