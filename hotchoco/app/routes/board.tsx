import { Link, useParams } from "react-router";
import type { Route } from "./+types/board";

const containerClass = "mx-auto w-full max-w-[430px] px-4 sm:px-6";

export const links: Route.LinksFunction = () => [];

export function meta() {
  return [
    { title: "게시판" },
    { name: "description", content: "게시판 보기" },
  ];
}

export default function BoardDetailPage() {
  const params = useParams();
  const title = params.name ?? "게시판";

  return (
    <div className="min-h-[100svh] bg-white text-[#111827]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className={`${containerClass} flex items-center gap-3 py-3`}>
          <Link to="/boards" aria-label="뒤로" className="-ml-1 p-1 text-inherit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </header>

      <main className={`${containerClass} pb-24 pt-4`}>
        {/* 흰색 페이지 유지. 내용 없음 */}
      </main>
    </div>
  );
}
