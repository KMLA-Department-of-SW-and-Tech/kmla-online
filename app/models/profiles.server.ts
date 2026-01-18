export async function getProfileById(supabase, userId) {
  if (!userId) return { data: null, error: null };
  return supabase
    .from("profiles")
    .select("id, display_name, bio, phone_number, email, avatar_url")
    .eq("id", userId)
    .single();
}

export async function listProfilesByIds(supabase, ids) {
  if (!ids?.length) return { data: [], error: null };
  return supabase
    .from("profiles")
    .select("id, display_name, avatar_url, email")
    .in("id", ids);
}
