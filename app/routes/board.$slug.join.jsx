import { redirect } from "react-router";
import { createClient } from "../lib/server";
import { getBoardBySlug } from "../models/boards.server";
import {
  createMembership,
  getMembershipForBoard,
} from "../models/memberships.server";
import { createJoinRequest } from "../models/joinRequests.server";

export async function action({ request, params }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  const { data: board, error: boardError } = await getBoardBySlug(
    supabase,
    params.slug,
  );

  if (boardError || !board) {
    throw new Response("Board not found", { status: 404 });
  }

  const { data: existingMembership } = await getMembershipForBoard(
    supabase,
    board.id,
    session.user.id,
  );

  if (existingMembership) {
    return redirect(`/boards/${board.slug}`, { headers });
  }

  if (board.join_mode === "invite_only") {
    return redirect(`/boards/${board.slug}?join=forbidden`, { headers });
  }

  if (board.join_mode === "request") {
    const form = await request.formData();
    const message = String(form.get("message") || "").trim();
    const { error } = await createJoinRequest(supabase, {
      board_id: board.id,
      user_id: session.user.id,
      message: message || null,
    });

    if (error) {
      console.error("Failed to request join", error);
      return redirect(`/boards/${board.slug}?join=error`, { headers });
    }

    return redirect(`/boards/${board.slug}?join=requested`, { headers });
  }

  const { error } = await createMembership(supabase, {
    board_id: board.id,
    user_id: session.user.id,
    role: "member",
  });

  if (error) {
    console.error("Failed to join board", error);
    return redirect(`/boards/${board.slug}?join=error`, { headers });
  }

  return redirect(`/boards/${board.slug}?join=joined`, { headers });
}
