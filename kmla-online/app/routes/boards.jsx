import { Link, useLoaderData } from "react-router";
import { createClient } from "../lib/server";

const containerClass = "mx-auto w-full max-w-[430px] px-4 sm:px-6";

export const links = () => [];

export function meta() {
  return [
    { title: "게시판" },
    { name: "description", content: "게시판 카테고리" },
  ];
}

export async function loader({ request }) {
  const { supabase } = createClient(request);
  const { data, error } = await supabase
    .from("boards")
    .select("id,name,section,side,position")
    .order("position", { ascending: true });

  if (error) {
    console.error("Failed to load boards", error);
    return { boards: [] };
  }

  return { boards: data ?? [] };
}

export default function BoardsPage() {
  const { boards } = useLoaderData();
  const noticesLeft = boards
    .filter((board) => board.section === "notice" && board.side === "left")
    .map((board) => board.name);
  const noticesRight = boards
    .filter((board) => board.section === "notice" && board.side === "right")
    .map((board) => board.name);
  const favorites = boards
    .filter((board) => board.section === "favorite")
    .map((board) => board.name);

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link to="/" aria-label="뒤로" className="-ml-1 p-1 text-inherit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">게시판</h1>
        </div>
        <div className={`${containerClass} flex items-center gap-2 pb-3 pt-1`}>
          <div className="flex gap-2">
            <button type="button" className="rounded-full border border-transparent bg-[#10c1a5] px-3 py-1.5 text-[13px] font-semibold text-white">메뉴</button>
            <button type="button" className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-[#111827]">최신순</button>
          </div>
          <Link to="/boards/request" className="ml-auto text-sm text-[#6b7280] transition hover:text-[#111827]">
            게시판 개설요청 &gt;
          </Link>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        <section className="mb-4">
          <h2 className="mb-3 text-[22px] font-bold leading-tight">학생 공지</h2>
          <div className="grid grid-cols-2 items-start gap-x-6">
            <ul className="grid list-none gap-y-3 p-0">
              {noticesLeft.map((name) => (
                <li key={name} className="flex h-8 items-center">
                  <Link className="block truncate text-[15px] text-[#111827] hover:underline" to={`/boards/${encodeURIComponent(name)}`}>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="grid list-none gap-y-3 p-0">
              {noticesRight.map((name) => (
                <li key={name} className="flex h-8 items-center">
                  <Link className="block truncate text-[15px] text-[#111827] hover:underline" to={`/boards/${encodeURIComponent(name)}`}>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <hr className="my-6 h-px border-0 bg-gray-200" />

        <section className="mb-4">
          <div className="flex items-center">
            <h2 className="text-[22px] font-bold leading-tight">즐겨찾는 게시판</h2>
            <Link to="#" className="ml-auto text-sm text-gray-500 transition hover:text-[#111827]">
              더보기 ▸
            </Link>
          </div>
          <ul className="mt-3 grid list-none gap-y-3 p-0 text-[15px]">
            {favorites.map((name) => (
              <li key={name}>
                <Link className="block text-[#111827] hover:underline" to={`/boards/${encodeURIComponent(name)}`}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
        <div className={`${containerClass} flex items-center justify-between gap-1 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2`}>
          <Tab icon={<HomeIcon />} to="/" />
          <Tab icon={<CapIcon />} to="#" />
          <Tab icon={<ListIcon active />} to="/boards" active />
          <Tab icon={<ChatIcon />} to="#" badge={2} />
          <Tab icon={<UserIcon />} to="#" />
        </div>
      </nav>
    </div>
  );
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
