/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "~/lib/client";
const supabase = createClient();

const YOUTUBE_API_KEY = "AIzaSyBrAr6dxzLvW8t8apB3hw_-Fucn1nzcOvk";
const USER_NAME = "30기 고동재";

type VideoItem = {
  title: string;
  url: string;
  thumbnail: string;
};

function useDebounced(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SearchSong({
  open,
  onClose,
  onPick,
  initialQuery = "",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (video: VideoItem) => Promise<void> | void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounced(query);

  async function insert(item: { title: string; url: string }) {
    try {
      const date = new Date().toISOString();
      const { error } = await supabase.from("items").insert([
        {
          title: USER_NAME,
          url: item.url,
          date: date,
        },
      ]);
      if (error) {
        console.error("Insert failed:", error.message);
        alert("저장 중 오류가 발생했습니다.");
      } else {
        console.log("Inserted:", item);
        alert("신청이 완료되었습니다!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  async function searchYoutube(q: string) {
    try {
      setLoading(true);
      setError(null);

      const url =
        "https://www.googleapis.com/youtube/v3/search" +
        `?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(q)}` +
        `&key=${YOUTUBE_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
      const data = await res.json();

      const list: VideoItem[] = (data.items || []).map((it: any) => ({
        title: it?.snippet?.title ?? "(제목 없음)",
        url: `https://www.youtube.com/watch?v=${it?.id?.videoId ?? ""}`,
        thumbnail: it?.snippet?.thumbnails?.medium?.url ?? "",
      }));

      setResults(list);
    } catch (e: any) {
      setResults([]);
      setError(e?.message || "검색 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && debouncedQuery.trim()) {
      searchYoutube(debouncedQuery);
    }
  }, [open, debouncedQuery]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-t-[28px] bg-white p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-center">
          <h2 className="mb-2 text-[32px] font-extrabold text-slate-900">
            신청하기
          </h2>
          <p className="text-sm text-slate-500">
            기상송으로 부적합한 노래는 삭제될 수 있습니다!
          </p>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5">
          <img
            src="/searchIcon.png"
            alt="검색"
            className="h-5 w-5 opacity-70"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ex) Bruno Mars - Die With A Smile"
            className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {loading && (
          <div className="mt-2 text-center text-sm text-slate-500">
            불러오는 중...
          </div>
        )}
        {error && (
          <div className="mt-2 text-center text-sm text-red-500">{error}</div>
        )}

        <div className="mt-2 flex max-h-[36vh] flex-col gap-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {results.map((v, i) => (
            <button
              key={i}
              className="grid w-full grid-cols-[35%_65%] items-center gap-3 rounded-xl bg-white p-2 text-left transition hover:bg-slate-50 hover:shadow-sm"
              onClick={async () => {
                await insert(v);
                await onPick(v);
                setQuery("");
                setResults([]);
                setError(null);
                onClose();
              }}
            >
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={v.thumbnail}
                  alt=""
                  className="aspect-video w-full bg-slate-200 object-cover"
                />
              </a>
              <div className="min-w-0">
                <span className="text-[15px] font-semibold text-slate-900 line-clamp-2">
                  {v.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RequestButton() {
  const [open, setOpen] = useState(false);

  async function handlePick(video: { title: string; url: string }) {
    await supabase.from("items").insert({
      name: USER_NAME,
      url: video.url,
      date: new Date().toISOString(),
    });
  }

  return (
    <main className="p-4 text-center">
      <button
        className="cursor-pointer border-0 bg-transparent inline-block"
        onClick={() => setOpen(true)}
      >
        <img src="/button.png" alt="신청하기" className="h-auto w-40" />
      </button>

      <SearchSong
        open={open}
        onClose={() => setOpen(false)}
        onPick={async (video) => {
          await handlePick(video);
          setOpen(false);
        }}
      />
    </main>
  );
}

export default function Home() {
  return (
    <main className="flex justify-center pt-[100px]">
      <RequestButton />
    </main>
  );
}
