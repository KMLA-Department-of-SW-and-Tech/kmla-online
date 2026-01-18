import { Form, Link, redirect, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import { getBoardBySlug } from "../models/boards.server";
import {
  getMembershipForBoard,
  listBoardMembers,
} from "../models/memberships.server";
import {
  approveJoinRequest,
  listPendingJoinRequestsForBoard,
  reviewJoinRequest,
} from "../models/joinRequests.server";
import { listProfilesByIds } from "../models/profiles.server";

const containerClass = "mx-auto w-full max-w-[430px] px-4";

export async function loader({ request, params }) {
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

  const { data: membership } = await getMembershipForBoard(
    supabase,
    board.id,
    session.user.id,
  );

  if (!membership) {
    throw redirect(`/boards/${board.slug}`);
  }

  const { data: members, error: membersError } = await listBoardMembers(
    supabase,
    board.id,
  );

  if (membersError) {
    console.error("Failed to load members", membersError);
  }

  const memberIds = Array.from(
    new Set((members ?? []).map((row) => row.user_id).filter(Boolean)),
  );
  const { data: memberProfiles } = await listProfilesByIds(supabase, memberIds);
  const memberProfileMap = new Map(
    (memberProfiles ?? []).map((profile) => [profile.id, profile]),
  );

  const hydratedMembers = (members ?? []).map((row) => ({
    ...row,
    profile: memberProfileMap.get(row.user_id) ?? null,
  }));

  const isAdmin = ["admin", "owner"].includes(membership.role);
  let pendingRequests = [];

  if (isAdmin) {
    const { data: requests, error: requestError } =
      await listPendingJoinRequestsForBoard(supabase, board.id);

    if (requestError) {
      console.error("Failed to load join requests", requestError);
    }

    const requesterIds = Array.from(
      new Set((requests ?? []).map((row) => row.user_id).filter(Boolean)),
    );
    const { data: requesterProfiles } = await listProfilesByIds(
      supabase,
      requesterIds,
    );
    const requesterMap = new Map(
      (requesterProfiles ?? []).map((profile) => [profile.id, profile]),
    );

    pendingRequests = (requests ?? []).map((row) => ({
      ...row,
      profile: requesterMap.get(row.user_id) ?? null,
    }));
  }

  return Response.json(
    { board, membership, members: hydratedMembers, pendingRequests, isAdmin },
    { headers },
  );
}

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

  const { data: membership } = await getMembershipForBoard(
    supabase,
    board.id,
    session.user.id,
  );

  if (!membership || !["admin", "owner"].includes(membership.role)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const requestId = Number(form.get("requestId") || 0);

  if (intent === "approve" && requestId) {
    const { error } = await approveJoinRequest(
      supabase,
      requestId,
      session.user.id,
    );
    if (error) {
      console.error("Failed to approve join request", error);
    }
  }

  if (intent === "reject" && requestId) {
    const { error } = await reviewJoinRequest(
      supabase,
      requestId,
      "rejected",
      session.user.id,
    );
    if (error) {
      console.error("Failed to reject join request", error);
    }
  }

  return redirect(`/boards/${board.slug}/members`, { headers });
}

export default function BoardMembersPage() {
  const { board, members, pendingRequests, isAdmin } = useLoaderData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link
            to={`/boards/${board.slug}`}
            aria-label="Back"
            className="-ml-1 p-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6L9 12L15 18"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Members</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        {isAdmin && pendingRequests.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-[18px] font-semibold">Join requests</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="text-sm font-semibold">
                    {request.profile?.display_name || "Unknown"}
                  </div>
                  {request.message && (
                    <p className="mt-1 text-sm text-gray-500">
                      {request.message}
                    </p>
                  )}
                  <Form method="post" className="mt-3 flex gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="approve"
                      className="rounded-full bg-[#10b981] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="reject"
                      className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold"
                    >
                      Reject
                    </button>
                  </Form>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-[18px] font-semibold">All members</h2>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {member.profile?.display_name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
