import { Outlet, useLoaderData, useNavigation } from "react-router";
import { redirect } from "react-router";
import { createClient } from "../lib/server";

export async function loader({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
  }

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  return Response.json({ userId: session.user.id }, { headers });
}

export default function AppShell() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  useLoaderData();

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      {isLoading && (
        <div className="h-1 w-full bg-[#10c1a5]/40">
          <div className="h-1 w-1/3 animate-pulse bg-[#10c1a5]" />
        </div>
      )}
      <Outlet />
    </div>
  );
}
