import { Link, redirect, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import { getPostById } from "../models/posts.server";
import { getMembershipForBoard } from "../models/memberships.server";
import { listProfilesByIds } from "../models/profiles.server";

const containerClass = "mx-auto w-full max-w-[430px] px-4 sm:px-6";

export async function loader({ request, params }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: post, error } = await getPostById(supabase, Number(params.id));

  if (error || !post) {
    throw new Response("Post not found", { status: 404 });
  }

  if (post.boards && post.boards.is_public === false) {
    if (!session?.user) {
      throw redirect("/boards");
    }

    const { data: membership } = await getMembershipForBoard(
      supabase,
      post.board_id,
      session.user.id,
    );

    if (!membership) {
      throw redirect("/boards");
    }
  }

  const { data: profiles } = await listProfilesByIds(supabase, [post.user_id]);
  const author = profiles?.[0] ?? null;

  return Response.json({ post, author }, { headers });
}

export default function PostDetailPage() {
  const { post, author } = useLoaderData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link
            to={post.boards ? `/boards/${post.boards.slug}` : "/boards"}
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
          <h1 className="text-2xl font-bold">Post</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-[20px] font-semibold leading-snug">
            {post.title}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>
              {post.writer_override || author?.display_name || "Unknown"}
            </span>
            <span>�</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
          {post.content && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
              {post.content}
            </p>
          )}
        </article>
      </main>
    </div>
  );
}
