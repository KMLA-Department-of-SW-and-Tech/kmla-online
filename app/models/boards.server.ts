export async function listBoards(supabase) {
  return supabase
    .from("boards")
    .select(
      "id, name, slug, section, side, position, description, join_mode, is_public, is_default, is_active",
    )
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("position", { ascending: true });
}

export async function getBoardBySlug(supabase, slug) {
  if (!slug) return { data: null, error: null };
  return supabase
    .from("boards")
    .select(
      "id, name, slug, description, join_mode, is_public, is_default, is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
}
