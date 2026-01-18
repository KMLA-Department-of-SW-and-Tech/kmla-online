import { Form, Link, redirect, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import { getBoardBySlug } from "../models/boards.server";
import { listPostsForBoard } from "../models/posts.server";
import { getMembershipForBoard } from "../models/memberships.server";
import { listProfilesByIds } from "../models/profiles.server";

const containerClass = "mx-auto w-full max-w-[430px] px-4";

export async function loader({ request, params }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: board, error: boardError } = await getBoardBySlug(
    supabase,
    params.slug,
  );

  if (boardError || !board) {
    throw new Response("Board not found", { status: 404 });
  }

  let membership = null;
  if (session?.user) {
    const { data: membershipData } = await getMembershipForBoard(
      supabase,
      board.id,
      session.user.id,
    );
    membership = membershipData ?? null;
  }

  if (!board.is_public && !membership) {
    throw redirect("/boards");
  }

  const { data: posts, error: postsError } = await listPostsForBoard(
    supabase,
    board.id,
  );

  if (postsError) {
    console.error("Failed to load posts", postsError);
  }

  const authorIds = Array.from(
    new Set((posts ?? []).map((post) => post.user_id).filter(Boolean)),
  );
  const { data: profiles } = await listProfilesByIds(supabase, authorIds);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const hydratedPosts = (posts ?? []).map((post) => ({
    ...post,
    author: profileMap.get(post.user_id) ?? null,
  }));

  return Response.json(
    { board, posts: hydratedPosts, membership },
    { headers },
  );
}

export default function BoardDetailPage() {
  const { board, posts, membership } = useLoaderData();

  return (
    <div className="min-h-[100svh] bg-[#f5f5f7] text-[#111827]">
      <header className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link
            to="/boards"
            aria-label="Back"
            className="-ml-1 p-1 text-inherit"
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
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">
            {board.name}
          </h1>
        </div>
      </header>

      <main className={`${containerClass} pb-32 pt-2`}>
        {!membership && board.join_mode !== "invite_only" && (
          <Form
            method="post"
            action={`/boards/${encodeURIComponent(board.slug)}/join`}
            className="mb-4 rounded-[16px] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            <p className="text-sm text-gray-600">
              {board.join_mode === "request"
                ? "This board requires approval to join."
                : "Join this board to post and see member-only content."}
            </p>
            {board.join_mode === "request" && (
              <textarea
                name="message"
                rows={3}
                className="mt-3 w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Add a short message (optional)"
              />
            )}
            <button
              type="submit"
              className="mt-3 rounded-full bg-[#10b981] px-4 py-2 text-sm font-semibold text-white"
            >
              {board.join_mode === "request" ? "Request to Join" : "Join Board"}
            </button>
          </Form>
        )}

        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="rounded-[16px] bg-white p-4 text-sm text-gray-500">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-[16px] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Link
                      to={`/posts/${post.id}`}
                      className="text-[15px] font-semibold leading-5 text-[#111827]"
                    >
                      {post.title}
                    </Link>
                    {post.content && (
                      <p className="mt-1 text-[13px] leading-5 text-[#6b7280]">
                        {post.content.slice(0, 90)}
                        {post.content.length > 90 ? "..." : ""}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-[#6b7280]">
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span>{post.view_count} views</span>
                      <span className="ml-auto text-[#111827]">
                        {post.writer_override ||
                          post.author?.display_name ||
                          "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {membership && (
        <Link
          to={`/posts/new?board=${encodeURIComponent(board.slug)}`}
          aria-label="New post"
          className="fixed bottom-[120px] right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981] text-white shadow-[0_10px_20px_rgba(16,185,129,0.35)]"
        >
          <PlusIcon />
        </Link>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20">
        <div
          className={`${containerClass} pb-[calc(12px+env(safe-area-inset-bottom,0px))]`}
        >
          <div className="rounded-[18px] bg-white px-4 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.12)]">
            <ul className="grid gap-3 text-[14px] font-semibold text-[#111827]">
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                  <SparkIcon />
                </span>
                Related posts
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                  <HistoryIcon />
                </span>
                Recent activity
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                  <EditIcon />
                </span>
                New post
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="stroke-current"
    >
      <path d="M12 5V19M5 12H19" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="stroke-current"
    >
      <path
        d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="stroke-current"
    >
      <path d="M3 12A9 9 0 1 0 6 5" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 4V8H7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 7V12L15 14" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="stroke-current"
    >
      <path
        d="M4 20H8L19 9L15 5L4 16V20Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 6L18 10" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
