// app/routes/post.jsx
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/client";

// ====== 고정: 포스트 ID (필요 시 URL 파라미터로 바꿔도 됨)
const POST_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

// ---------- 유틸 ----------
function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

// ---------- 프리젠테이션 컴포넌트들 (그대로 사용) ----------
function ImageTile({ image, className = "", overlayCount, onClick }) {
  if (!image) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block h-full w-full overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
    >
      <img
        src={image.src}
        alt={image.alt || ""}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      />
      {overlayCount ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white">
          +{overlayCount}
        </div>
      ) : null}
    </button>
  );
}

function PostImageGrid({ images, onImageClick }) {
  if (!images?.length) return null;
  const total = images.length;

  if (total === 1) {
    return (
      <div className="mt-4 px-5">
        <ImageTile
          image={images[0]}
          onClick={() => onImageClick?.(0)}
          className="aspect-[4/3]"
        />
      </div>
    );
  }

  if (total === 2) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2 px-5">
        {images.map((image, index) => (
          <ImageTile
            key={image.id}
            image={image}
            className="aspect-square"
            onClick={() => onImageClick?.(index)}
          />
        ))}
      </div>
    );
  }

  if (total === 3) {
    return (
      <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-2 px-5">
        <ImageTile
          image={images[0]}
          className="row-span-2 aspect-[3/4]"
          onClick={() => onImageClick?.(0)}
        />
        <ImageTile
          image={images[1]}
          className="aspect-square"
          onClick={() => onImageClick?.(1)}
        />
        <ImageTile
          image={images[2]}
          className="aspect-square"
          onClick={() => onImageClick?.(2)}
        />
      </div>
    );
  }

  const overlayCount = total - 3;
  return (
    <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-2 px-5">
      <ImageTile
        image={images[0]}
        className="row-span-2 aspect-[3/4]"
        onClick={() => onImageClick?.(0)}
      />
      <ImageTile
        image={images[1]}
        className="aspect-square"
        onClick={() => onImageClick?.(1)}
      />
      <ImageTile
        image={images[2]}
        overlayCount={overlayCount}
        className="aspect-square"
        onClick={() => onImageClick?.(2)}
      />
    </div>
  );
}

function BottomSheet({ open, onClose, items, title }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="메뉴 닫기"
        className="h-full w-full bg-black/40"
        onClick={onClose}
      />
      <div className="relative rounded-t-3xl bg-white pb-8 shadow-xl">
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        {title ? (
          <p className="px-6 pt-4 text-sm font-medium text-gray-500">{title}</p>
        ) : null}
        <div className="mt-2 space-y-1 px-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => {
                item.onSelect?.();
                onClose();
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[15px] font-medium text-gray-900">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ images, index, onClose, onNavigate }) {
  if (index === null || index === undefined) return null;
  const image = images?.[index];
  if (!image) return null;
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          type="button"
          aria-label="뒤로"
          className="text-white"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="text-sm font-medium text-white">
          {index + 1} / {images.length}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-10">
        <img
          src={image.src}
          alt={image.alt || ""}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain"
        />
      </div>
      <div className="flex items-center justify-between px-6 pb-8 text-white">
        <button
          type="button"
          className={`rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur ${
            hasPrev ? "opacity-100" : "opacity-40"
          }`}
          onClick={() => hasPrev && onNavigate(index - 1)}
          disabled={!hasPrev}
        >
          이전
        </button>
        <button
          type="button"
          className={`rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur ${
            hasNext ? "opacity-100" : "opacity-40"
          }`}
          onClick={() => hasNext && onNavigate(index + 1)}
          disabled={!hasNext}
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ---------- 페이지 ----------
const postActionItems = [
  { id: "bookmark", icon: "🔖", label: "게시물 저장" },
  { id: "link", icon: "🔗", label: "링크 복사" },
  { id: "hide", icon: "🙈", label: "게시물 숨기기" },
  { id: "report", icon: "🚩", label: "게시물 신고" },
  { id: "block", icon: "🚫", label: "프로필 차단" },
];

const commentActionItems = [
  { id: "reply", icon: "↩️", label: "답글 달기" },
  { id: "edit", icon: "✏️", label: "수정하기" },
  { id: "delete", icon: "🗑️", label: "삭제하기" },
  { id: "copy", icon: "📋", label: "복사하기" },
];

export default function Post() {
  const supabase = useMemo(() => createClient(), []);
  const [post, setPost] = useState(null);
  const [isPostSheetOpen, setPostSheetOpen] = useState(false);
  const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // ---- Supabase에서 단일 포스트 JSON 가져오기
  useEffect(() => {
    let aborted = false;

    async function load() {
      setLoading(true);
      setErrMsg("");
      try {
        const { data, error } = await supabase.rpc("get_post_json", {
          p_post_id: POST_ID,
        });

        if (error) throw error;

        if (!aborted) {
          // RPC의 반환 구조를 컴포넌트에서 기대하는 구조로 그대로 사용
          // (이미 SQL이 boardName/title/body/createdAt/author/likeCount/images/attachments/comments로 맞춰줌)
          // null safety 보강
          const normalized = {
            boardName: data?.boardName ?? "",
            title: data?.title ?? "",
            body: data?.body ?? "",
            createdAt: data?.createdAt ?? "",
            author: {
              name: data?.author?.name ?? "",
              avatar: data?.author?.avatar ?? "",
              grade: data?.author?.grade ?? "",
            },
            likeCount: data?.likeCount ?? 0,
            images: Array.isArray(data?.images) ? data.images : [],
            attachments: Array.isArray(data?.attachments)
              ? data.attachments
              : [],
            comments: Array.isArray(data?.comments) ? data.comments : [],
          };
          setPost(normalized);
        }
      } catch (e) {
        if (!aborted) setErrMsg(e?.message || "failed to load");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [supabase]);

  // 댓글 총합 계산
  const commentCount = useMemo(() => {
    if (!post?.comments) return 0;
    return post.comments.reduce(
      (sum, c) => sum + 1 + (Array.isArray(c.replies) ? c.replies.length : 0),
      0
    );
  }, [post?.comments]);

  const displayLikeCount = (post?.likeCount ?? 0) + (liked ? 1 : 0);

  // ----- 로딩/에러 핸들링
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pb-16">
        <main className="mx-auto max-w-md px-4 pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-64 w-full rounded-2xl bg-gray-200" />
          </div>
        </main>
      </div>
    );
  }

  if (errMsg || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-md px-4 pt-10">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            불러오기에 실패했어요. {errMsg && <span>({errMsg})</span>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="뒤로가기"
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-900">
              {post.boardName}
            </p>
          </div>
          <button
            type="button"
            aria-label="게시물 메뉴"
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setPostSheetOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        <article className="rounded-[28px] bg-white shadow-sm ring-1 ring-gray-100">
          <div className="px-5 pt-5">
            <div className="flex items-center gap-3">
              <div className="size-11 overflow-hidden rounded-full bg-gray-200">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  {post.author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(post.createdAt)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-[15px] font-semibold text-gray-900">
                {post.title}
              </h1>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {post.body}
              </p>
            </div>
          </div>

          <PostImageGrid
            images={post.images}
            onImageClick={(index) => setSelectedImageIndex(index)}
          />

          {post.attachments?.length ? (
            <div className="mt-5 space-y-2 px-5">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-gray-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white text-emerald-500 ring-1 ring-emerald-100">
                    📄
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{attachment.name}</span>
                    <span className="text-xs text-gray-500">
                      {attachment.description}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-800 transition hover:bg-gray-200"
                onClick={() => setLiked((prev) => !prev)}
              >
                <span className="text-emerald-500">👍</span>
                좋아요
                <span className="text-gray-500">{displayLikeCount}</span>
              </button>
              <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-800">
                <span className="text-emerald-500">💬</span>
                댓글
                <span className="text-gray-500">{commentCount}</span>
              </div>
              <button
                type="button"
                className="rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-800 hover:bg-gray-200"
              >
                스크랩
              </button>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 px-5 py-5">
            {post.comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => {
                    setSelectedComment(comment.id);
                    setCommentSheetOpen(true);
                  }}
                >
                  <div className="size-9 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="inline-flex max-w-full flex-col rounded-2xl bg-gray-100 px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author.name}
                      </span>
                      <p className="mt-1 text-sm text-gray-700">
                        {comment.content}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatTimestamp(comment.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <span className="text-[13px]">👍</span>
                        {comment.reactions}
                      </span>
                    </div>
                  </div>
                </button>

                {comment.replies?.length ? (
                  <div className="space-y-3 pl-12">
                    {comment.replies.map((reply) => (
                      <button
                        type="button"
                        key={reply.id}
                        className="flex w-full items-start gap-3 text-left"
                        onClick={() => {
                          setSelectedComment(reply.id);
                          setCommentSheetOpen(true);
                        }}
                      >
                        <div className="size-9 shrink-0 overflow-hidden rounded-full bg-gray-200">
                          <img
                            src={reply.author.avatar}
                            alt={reply.author.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="inline-flex max-w-full flex-col rounded-2xl bg-gray-100 px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {reply.author.name}
                            </span>
                            <p className="mt-1 text-sm text-gray-700">
                              {reply.content}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatTimestamp(reply.createdAt)}</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <span className="text-[13px]">👍</span>
                              {reply.reactions}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </main>

      <BottomSheet
        open={isPostSheetOpen}
        onClose={() => setPostSheetOpen(false)}
        items={postActionItems}
      />

      <BottomSheet
        open={isCommentSheetOpen}
        onClose={() => {
          setSelectedComment(null);
          setCommentSheetOpen(false);
        }}
        items={commentActionItems.map((item) => ({
          ...item,
          onSelect: () => {
            console.info(
              `comment action "${item.id}" for comment:`,
              selectedComment
            );
          },
        }))}
      />

      <PhotoViewer
        images={post.images}
        index={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onNavigate={(nextIndex) => setSelectedImageIndex(nextIndex)}
      />
    </div>
  );
}
