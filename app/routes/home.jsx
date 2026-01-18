import { redirect, useFetcher, useLoaderData } from "react-router";
import { createClient } from "../lib/server";
import {
  listApprovedSongsForDate,
  listSongsForUser,
} from "../models/songs.server";
import { listProfilesByIds } from "../models/profiles.server";

const slots = 2;

function getLocalDateKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getThumbnail(song) {
  if (song?.youtube_thumbnail_url) return song.youtube_thumbnail_url;
  if (song?.youtube_video_id) {
    return `https://img.youtube.com/vi/${song.youtube_video_id}/hqdefault.jpg`;
  }
  return "/default-thumbnail.png";
}

export async function loader({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const todayKey = getLocalDateKey();
  const { data: todaySongs, error: todayError } =
    await listApprovedSongsForDate(supabase, todayKey);

  if (todayError) {
    console.error("Failed to load today songs", todayError);
  }

  let pastSongs = [];
  if (session?.user) {
    const { data, error } = await listSongsForUser(
      supabase,
      session.user.id,
      20,
    );
    if (error) {
      console.error("Failed to load user songs", error);
    } else {
      pastSongs = data ?? [];
    }
  }

  const profileIds = Array.from(
    new Set(
      [...(todaySongs ?? []), ...(pastSongs ?? [])]
        .map((song) => song.user_id)
        .filter(Boolean),
    ),
  );
  const { data: profiles } = await listProfilesByIds(supabase, profileIds);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const hydrate = (song) => ({
    ...song,
    author: profileMap.get(song.user_id) ?? null,
  });

  return Response.json(
    {
      todaySongs: (todaySongs ?? []).map(hydrate),
      pastSongs: (pastSongs ?? []).map(hydrate),
      isAuthed: Boolean(session?.user),
    },
    { headers },
  );
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

  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "delete") {
    const id = Number(formData.get("id") || 0);
    if (!id) {
      return Response.json({ ok: false }, { status: 400, headers });
    }

    const { error } = await supabase.from("songs").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete song", error);
      return Response.json({ ok: false }, { status: 400, headers });
    }
  }

  return Response.json({ ok: true }, { headers });
}

export default function MorningMusic() {
  const { todaySongs, pastSongs, isAuthed } = useLoaderData();
  const fetcher = useFetcher();

  const paddedToday = [...todaySongs];
  while (paddedToday.length < slots) paddedToday.push(null);

  return (
    <div className="min-h-screen bg-[#F8F8FA] px-[5vw] py-[5vw]">
      <div className="mt-[2vh] mb-[3vh] flex flex-row items-center">
        <img
          src="/musicnote.png"
          alt="musical note"
          className="mr-[2vw] h-[30px] w-[30px]"
        />
        <h1 className="m-0 text-[24px] leading-[34px] tracking-[-0.025em] font-semibold lg:text-[40px]">
          Past submissions
        </h1>
      </div>

      <section className="mb-[5vh]">
        <h2 className="mt-0 mb-[2vh] text-[16px] leading-6 tracking-[-0.025em] font-semibold">
          Past submissions
        </h2>

        <div className="flex flex-col gap-[1vh]">
          {paddedToday.map((song, idx) => (
            <div
              key={song?.id ?? `slot-${idx}`}
              className="min-h-[80px] overflow-hidden rounded-[12px] bg-white flex items-center p-0 lg:min-h-[120px]"
            >
              <img
                src={song ? getThumbnail(song) : "/default-thumbnail.png"}
                alt={song?.youtube_title || "Unknown"}
                className="h-[80px] w-[120px] flex-shrink-0 object-cover rounded-l-[12px] lg:h-[120px] lg:w-[200px]"
              />
              <div className="flex-1 px-4 py-3">
                <b className="block mb-1 text-[14px] font-semibold lg:text-[18px]">
                  {song?.youtube_title || "Unknown"}
                </b>
                <p className="m-0 p-0 text-[12px] font-normal text-[#545454] lg:text-[16px]">
                  {song?.author?.display_name || "Anonymous"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-[10vh] flex flex-col">
        <h2 className="mb-[2vh] text-[16px] leading-6 tracking-[-0.025em] font-semibold">
          Past submissions
        </h2>

        {!isAuthed ? (
          <p className="opacity-70">Login to view your past submissions.</p>
        ) : (
          <div className="flex flex-col gap-[1.5vh]">
            {pastSongs.length === 0 ? (
              <p className="opacity-70">No past submissions yet.</p>
            ) : (
              pastSongs.map((song) => (
                <div
                  key={song.id}
                  className="min-h-[60px] rounded-[12px] bg-white px-5 py-4 flex items-center justify-between"
                >
                  <b className="text-[14px] font-medium lg:text-[16px]">
                    {song.youtube_title || "Unknown"}
                  </b>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={song.id} />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center cursor-pointer border-none bg-transparent p-0 hover:opacity-70"
                      disabled={fetcher.state === "submitting"}
                      title="Delete"
                    >
                      <img
                        src="/delete.png"
                        alt="delete"
                        className="h-6 w-6"
                        style={{
                          opacity: fetcher.state === "submitting" ? 0.5 : 1,
                        }}
                      />
                    </button>
                  </fetcher.Form>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <button
        className="fixed bottom-[5vh] right-[5vw] cursor-pointer border-none bg-transparent p-0 hover:opacity-80"
        onClick={() => {}}
      >
        <img src="/button.png" alt="button" className="h-[60px] w-[60px]" />
      </button>
    </div>
  );
}
