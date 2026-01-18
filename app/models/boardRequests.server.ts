export async function createBoardRequest(supabase, payload) {
  return supabase.from("board_requests").insert(payload).select().single();
}
