import { Link, Form, useActionData } from "react-router";

const containerClass = "mx-auto w-full max-w-[430px] px-4 sm:px-6";

export const links = () => [];

export function meta() {
  return [
    { title: "게시판 개설요청" },
    { name: "description", content: "새 게시판 개설을 요청합니다" },
  ];
}

export default function BoardRequestPage() {
  const actionData = useActionData();
  const errorMessage =
    actionData && actionData.ok === false
      ? actionData.message || "요청 제출에 실패했습니다. 잠시 후 다시 시도해주세요."
      : null;

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link to="/boards" aria-label="뒤로" className="-ml-1 p-1 text-inherit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">게시판 개설요청</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        <section className="mb-4">
          <h2 className="mb-3 text-[22px] font-bold leading-tight">요청 정보</h2>
          {actionData?.ok && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              개설 요청이 저장되었습니다. 검토 후 안내드릴게요!
            </div>
          )}
          {errorMessage && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}
          <Form method="post" className="grid gap-3">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm text-gray-500">
                게시판 이름
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="예: 공강"
                className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:border-[#10c1a5] focus:outline-none focus:ring-2 focus:ring-[#10c1a5]/30"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm text-gray-500">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="게시판의 목적과 사용 가이드를 적어주세요"
                className="w-full resize-y rounded-2xl border border-gray-200 px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:border-[#10c1a5] focus:outline-none focus:ring-2 focus:ring-[#10c1a5]/30"
              />
            </div>

            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm text-gray-500">
                개설 사유
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                placeholder="개설이 필요한 이유를 적어주세요"
                className="w-full resize-y rounded-2xl border border-gray-200 px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:border-[#10c1a5] focus:outline-none focus:ring-2 focus:ring-[#10c1a5]/30"
              />
            </div>

            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-[#10c1a5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0ea48d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10c1a5]"
              >
                요청 제출
              </button>
              <Link
                to="/boards"
                className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-gray-50"
              >
                목록으로
              </Link>
            </div>
          </Form>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
        <div className={`${containerClass} flex items-center justify-between gap-1 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2`}>
          <Tab icon={<HomeIcon />} to="/" />
          <Tab icon={<CapIcon />} to="#" />
          <Tab icon={<ListIcon active />} to="/boards" />
          <Tab icon={<ChatIcon />} to="#" />
          <Tab icon={<UserIcon />} to="#" />
        </div>
      </nav>
    </div>
  );
}

export async function action({ request }) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const reason = String(form.get("reason") || "").trim();

  if (!name) {
    return { ok: false, error: "name_required", message: "게시판 이름을 입력해주세요." };
  }

  try {
    const SUPABASE_URL =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://pknwhzohdspdixdywktn.supabase.co";
    const SUPABASE_ANON_KEY =
      process.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbndoem9oZHNwZGl4ZHl3a3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODM3NDgsImV4cCI6MjA3Mzg1OTc0OH0.ZlO3CMGlhih-dZTjFg_sgOdeVDAJhkMCIGGJQJctecM";

    const res = await fetch(`${SUPABASE_URL}/rest/v1/board_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          name,
          description: description || null,
          reason: reason || null,
          created_at: new Date().toISOString(),
        },
      ]),
    });

    const data = await res.json().catch(() => undefined);
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      console.error("supabase insert failed", { status: res.status, message });
      return { ok: false, error: "supabase_insert_failed", message };
    }

    const inserted = Array.isArray(data) && data.length ? data[0] : undefined;
    return { ok: true, id: inserted?.id ?? null };
  } catch (err) {
    console.error("supabase request failed", err);
    return { ok: false, error: "save_failed" };
  }
}

function Tab({ icon, to, active, badge }) {
  const isActive = Boolean(active);

  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center px-3 py-1.5 text-[12px] text-gray-500 no-underline transition-colors ${isActive ? "font-semibold text-[#111827]" : ""}`}
    >
      <div className="relative">
        {icon}
        {isActive && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#10c1a5]" />}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </div>
      {isActive && <span className="absolute left-1/2 -bottom-1 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#111827]" />}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path d="M3 10L12 3L21 10V20A1 1 0 0 1 20 21H4A1 1 0 0 1 3 20Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path d="M12 3L2 8L12 13L22 8L12 3Z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 10V15C5 17 9 19 12 19C15 19 19 17 19 15V10" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function ListIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className="stroke-current">
      <rect x="4" y="5" width="16" height="14" rx="2" strokeWidth="1.8" />
      <path d="M7 9H17M7 12H17M7 15H13" strokeWidth="1.8" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path d="M21 12C21 16 17.5 19 13 19H8L4 21V16C3 14.5 3 13 3 12C3 7.5 7 5 12 5C17 5 21 8 21 12Z" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" strokeWidth="1.8" />
      <path d="M4 22C4 18.6863 6.68629 16 10 16H14C17.3137 16 20 18.6863 20 22" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
