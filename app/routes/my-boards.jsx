import { Link, redirect, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import { listBoardsForUser } from "../models/memberships.server";

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
    console.error("Failed to load memberships", error);
  }

  return Response.json({ memberships: data ?? [] }, { headers });
}

export default function MyBoardsPage() {
  const { memberships } = useLoaderData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} py-3`}>
          <h1 className="text-2xl font-bold">My boards</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        {memberships.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            You have not joined any boards yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {memberships.map((membership) => (
              <li
                key={membership.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <Link
                  to={`/boards/${membership.boards.slug}`}
                  className="text-sm font-semibold"
                >
                  {membership.boards.name}
                </Link>
                <div className="mt-1 text-xs text-gray-500">
                  Role: {membership.role}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
