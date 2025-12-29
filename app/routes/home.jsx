import { Link } from "react-router";

export function meta() {
  return [
    { title: "홈" },
    { name: "description", content: "KMLA 온라인 홈" },
  ];
}

export default function Home() {
  return (
    <main className="min-h-[100svh] bg-white text-[#111827]">
      <div className="mx-auto flex max-w-[430px] flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-bold">홈</h1>
        <p className="text-sm text-gray-500">게시판을 확인해 보세요.</p>
        <Link
          to="/boards"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white"
        >
          게시판 보러가기
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-current">
            <path d="M5 12H19M12 5L19 12L12 19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
