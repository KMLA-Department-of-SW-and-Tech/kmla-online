import { Form, redirect, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import {
  approveJoinRequest,
  listPendingJoinRequestsForAdmin,
  reviewJoinRequest,
} from "../models/joinRequests.server";
import { listProfilesByIds } from "../models/profiles.server";

const containerClass = "mx-auto w-full max-w-[430px] px-4 sm:px-6";

export async function loader({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  const { data: requests, error } =
    await listPendingJoinRequestsForAdmin(supabase);

  if (error) {
    console.error("Failed to load join requests", error);
  }

  const requesterIds = Array.from(
    new Set((requests ?? []).map((row) => row.user_id).filter(Boolean)),
  );
  const { data: profiles } = await listProfilesByIds(supabase, requesterIds);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const hydratedRequests = (requests ?? []).map((row) => ({
    ...row,
    profile: profileMap.get(row.user_id) ?? null,
  }));

  return Response.json({ requests: hydratedRequests }, { headers });
}

export async function action({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
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

  return redirect("/join-requests", { headers });
}

export default function JoinRequestsPage() {
  const { requests } = useLoaderData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} py-3`}>
          <h1 className="text-2xl font-bold">Join requests</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="text-sm font-semibold">
                  {request.profile?.display_name || "Unknown"}
                </div>
                <div className="text-xs text-gray-500">
                  {request.boards?.name || "Board"}
                </div>
                {request.message && (
                  <p className="mt-2 text-sm text-gray-600">
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
        )}
      </main>
    </div>
  );
}
