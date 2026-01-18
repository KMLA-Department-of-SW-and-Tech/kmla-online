import { createClient } from "~/lib/server";

export async function listMembershipsForUser(supabase, userId) {
  if (!userId) return { data: [], error: null };
  return supabase
    .from("board_memberships")
    .select("board_id, role, joined_at, is_locked")
    .eq("user_id", userId);
}

export async function getMembershipForBoard(supabase, boardId, userId) {
  if (!userId || !boardId) return { data: null, error: null };
  return supabase
    .from("board_memberships")
    .select("id, role, joined_at, is_locked")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .single();
}

export async function listBoardMembers(supabase, boardId) {
  if (!boardId) return { data: [], error: null };
  return supabase
    .from("board_memberships")
    .select("id, user_id, role, joined_at, is_locked")
    .eq("board_id", boardId);
}

export async function listBoardsForUser(supabase, userId) {
  if (!userId) return { data: [], error: null };
  return supabase
    .from("board_memberships")
    .select(
      "id, role, joined_at, is_locked, boards(id, name, slug, description, is_public, join_mode)",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
}

export async function createMembership(supabase, payload) {
  return supabase
    .from("board_memberships")
    .insert(payload, { onConflict: "board_id,user_id", ignoreDuplicates: true })
    .select()
    .single();
}

export async function ensureDefaultBoardMemberships(request, userId) {
  if (!userId) return { inserted: 0 };

  const { supabase } = createClient(request);
  const { data: boards, error: boardsError } = await supabase
    .from("boards")
    .select("id")
    .eq("is_default", true)
    .eq("is_active", true);

  if (boardsError) {
    console.error("Failed to load default boards", boardsError);
    return { inserted: 0 };
  }

  if (!boards?.length) return { inserted: 0 };

  const boardIds = boards.map((board) => board.id);
  const { data: memberships, error: membershipError } = await supabase
    .from("board_memberships")
    .select("board_id")
    .eq("user_id", userId)
    .in("board_id", boardIds);

  if (membershipError) {
    console.error("Failed to load memberships", membershipError);
    return { inserted: 0 };
  }

  const existing = new Set((memberships ?? []).map((row) => row.board_id));
  const missing = boardIds
    .filter((id) => !existing.has(id))
    .map((boardId) => ({
      board_id: boardId,
      user_id: userId,
      role: "member",
      is_locked: true,
    }));

  if (!missing.length) return { inserted: 0 };

  const { error: insertError } = await supabase
    .from("board_memberships")
    .insert(missing, {
      onConflict: "board_id,user_id",
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error("Failed to ensure default memberships", insertError);
    return { inserted: 0 };
  }

  return { inserted: missing.length };
}
