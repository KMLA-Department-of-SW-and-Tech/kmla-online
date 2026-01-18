export async function listPostsForBoard(supabase, boardId, limit = 20) {
  if (!boardId) return { data: [], error: null };
  return supabase
    .from("posts")
    .select(
      "id, board_id, user_id, title, content, writer_override, view_count, is_pinned, created_at",
    )
    .eq("board_id", boardId)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function getPostById(supabase, postId) {
  if (!postId) return { data: null, error: null };
  return supabase
    .from("posts")
    .select(
      "id, board_id, user_id, title, content, writer_override, view_count, is_pinned, created_at, updated_at, boards(name, slug, is_public)",
    )
    .eq("id", postId)
    .eq("is_deleted", false)
    .single();
}

export async function createPost(supabase, payload) {
  return supabase.from("posts").insert(payload).select().single();
}
