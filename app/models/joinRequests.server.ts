export async function createJoinRequest(supabase, payload) {
  return supabase.from("board_join_requests").insert(payload).select().single();
}

export async function listPendingJoinRequestsForBoard(supabase, boardId) {
  if (!boardId) return { data: [], error: null };
  return supabase
    .from("board_join_requests")
    .select("id, board_id, user_id, message, status, created_at")
    .eq("board_id", boardId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
}

export async function listPendingJoinRequestsForAdmin(supabase) {
  return supabase
    .from("board_join_requests")
    .select(
      "id, board_id, user_id, message, status, created_at, boards(name, slug)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });
}

export async function reviewJoinRequest(
  supabase,
  requestId,
  status,
  reviewerId,
) {
  if (!requestId) return { data: null, error: null };
  return supabase
    .from("board_join_requests")
    .update({
      status,
      reviewed_by: reviewerId ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();
}

export async function approveJoinRequest(supabase, requestId, reviewerId) {
  const { data: request, error } = await reviewJoinRequest(
    supabase,
    requestId,
    "approved",
    reviewerId,
  );

  if (error || !request) {
    return { data: null, error };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("board_memberships")
    .insert(
      {
        board_id: request.board_id,
        user_id: request.user_id,
        role: "member",
      },
      { onConflict: "board_id,user_id", ignoreDuplicates: true },
    )
    .select()
    .single();

  if (membershipError) {
    return { data: null, error: membershipError };
  }

  return { data: { request, membership }, error: null };
}
