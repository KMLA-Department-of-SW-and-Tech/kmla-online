import { Form, redirect, useActionData, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import { listBoardsForUser } from "../models/memberships.server";
import { createPost } from "../models/posts.server";

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

  const { data, error } = await listBoardsForUser(supabase, session.user.id);

  if (error) {
    console.error("Failed to load boards", error);
  }

  return Response.json({ boards: data ?? [] }, { headers });
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
  const boardId = Number(form.get("boardId") || 0);
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();

  if (!boardId || !title) {
    return Response.json(
      { ok: false, message: "Board and title are required." },
      { status: 400, headers },
    );
  }

  const { data, error } = await createPost(supabase, {
    board_id: boardId,
    user_id: session.user.id,
    title,
    content: content || null,
  });

  if (error) {
    console.error("Failed to create post", error);
    return Response.json(
      { ok: false, message: error.message },
      { status: 400, headers },
    );
  }

  return redirect(`/posts/${data.id}`, { headers });
}

export default function NewPostPage() {
  const { boards } = useLoaderData();
  const actionData = useActionData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} py-3`}>
          <h1 className="text-2xl font-bold">New post</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        {actionData?.message && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {actionData.message}
          </div>
        )}

        <Form method="post" className="grid gap-4">
          <div>
            <label
              className="mb-1.5 block text-sm text-gray-500"
              htmlFor="boardId"
            >
              Board
            </label>
            <select
              id="boardId"
              name="boardId"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select a board</option>
              {boards.map((membership) => (
                <option key={membership.id} value={membership.boards.id}>
                  {membership.boards.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm text-gray-500"
              htmlFor="title"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Post title"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm text-gray-500"
              htmlFor="content"
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Write your post"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-[#10b981] px-4 py-2 text-sm font-semibold text-white"
          >
            Publish
          </button>
        </Form>
      </main>
    </div>
  );
}
