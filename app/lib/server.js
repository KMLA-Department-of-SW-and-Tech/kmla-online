import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

export function createClient(request) {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.VITE_SUPABASE_URL, //VITE_ 는 신경 안써도 되나요?
    process.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY, //_PUBLISHABLE_OR_ANON_KEY 도 마찬가지인가요? 몰라서 env에 둘다 넣었습니다
    {
      cookies: {
        getAll() {
          const raw = request.headers.get("Cookie") || "";
          return parseCookieHeader(raw);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          });
        },
      },
    },
  );

  return { supabase, headers };
}
