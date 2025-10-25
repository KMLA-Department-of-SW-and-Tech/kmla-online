import type { Route } from "./+types/home";
import Card from "~/components/ui/card";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import { Fragment, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

// NOTE: 즐겨찾기 게시글 제목 넘칠 때 글자 단위로 자르는 거 너무 어려워서 ellipsis로 했어요
// NOTE: 이 페이지는 실제 db schema 없이 하는 의미가 없을 것 같아서 supabase 안 쓰고 걍 테스트용으로 만듦

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({}: Route.LoaderArgs) {
  const newAnnouncement = true;
  const points = 34;
  const posts: Post[] = [
    {
      board: "자유게시판",
      title: "조용히 하세요 4층",
      likes: 6,
      comments: 2,
    },
    {
      board: "익명게시판",
      title: "안녕하세요 소신발언 하겠습니다아아아아아아아아아",
      likes: 2,
      comments: 1,
      new: true,
    },
    {
      board: "행정위원회",
      title: "7월 행정위원회 공약 이행 보고",
    },
    {
      board: "질문게시판",
      title: "궁금한게 있는데 이 문제는 어떻게 해결하나요?",
      new: true,
    },
    {
      board: "방탈게시판",
      title: "안녕하세요 융합프로젝트 팀 연어들입니다아아아아아",
    },
    {
      board: "대나무숲",
      title: "과기부의 차은우 CJW 선배님 여친 있나요?",
      likes: 10000000,
      comments: 50,
      new: true,
    },
  ];
  const clubs: Club[] = [
    {
      name: "DEFCON",
      description: "코딩을 예술의 경지로 정보과학 동아리 데프콘",
      imageUrl: "/images/chad1.png",
    },
    {
      name: "JOKBO",
      description: "생물학 공부를 하고 싶다면 지원 고고염",
      imageUrl: "/images/chad2.png",
    },
    {
      name: "건축을 표현하다",
      description: "모래알과 그디르를 이용한 건축물",
      imageUrl: "/images/chad3.png",
    },
    {
      name: "DEFCON",
      description: "코딩을 예술의 경지로 정보과학 동아리 데프콘",
      imageUrl: "/images/chad1.png",
    },
    {
      name: "JOKBO",
      description: "생물학 공부를 하고 싶다면 지원 고고염",
      imageUrl: "/images/chad2.png",
    },
    {
      name: "건축을 표현하다",
      description: "모래알과 그디르를 이용한 건축물",
      imageUrl: "/images/chad3.png",
    },
  ];
  const mpts: Club[] = [
    {
      name: "Francais avec Aron",
      description: "박강현과 함께하는 재미있는 프랑스어",
      imageUrl: "/images/chad3.png",
    },
    {
      name: "Make lovely waifus",
      description: "노상우는 와이푸를 매우매우 좋아해",
      imageUrl: "/images/chad1.png",
    },
    {
      name: "외모지상주의",
      description: "민사고의 차은우 최정욱과 함께 잘생겨져요",
      imageUrl: "/images/chad2.png",
    },
  ];
  const studyGroups: Club[] = [
    {
      name: "Francais avec Aron",
      description: "박강현과 함께하는 재미있는 프랑스어",
      imageUrl: "/images/chad2.png",
    },
    {
      name: "Make lovely waifus",
      description: "노상우는 와이푸를 매우매우 좋아해",
      imageUrl: "/images/chad3.png",
    },
    {
      name: "외모지상주의",
      description: "민사고의 차은우 최정욱과 함께 잘생겨져요",
      imageUrl: "/images/chad1.png",
    },
  ];
  return { newAnnouncement, points, posts, clubs, mpts, studyGroups };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [emblaQuickRef, emblaQuickApi] = useEmblaCarousel({
    loop: false,
    slidesToScroll: 2,
  });
  const [emblaFindsRef, emblaFindsApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnapList, setScrollSnapList] = useState<number[]>([]);
  const [selectedFindTab, setSelectedFindTab] = useState(0);

  const studentName = "박강현";
  const studentId = "231045";
  const { newAnnouncement, points, posts, clubs, mpts, studyGroups } =
    loaderData;
  const fivePosts = posts.slice(0, 5);
  const finds = [clubs, mpts, studyGroups];

  useEffect(() => {
    if (!emblaQuickApi) return;
    setScrollSnapList(emblaQuickApi.scrollSnapList());
    emblaQuickApi.on("select", () =>
      setSelectedIndex(emblaQuickApi.selectedScrollSnap())
    );
  }, [emblaQuickApi]);
  return (
    <div className="flex flex-col bg-background py-8 px-5.5">
      <div className="flex pb-4">
        <div className="text-2xl font-semibold mr-1">{studentName}</div>
        <div className="flex items-end grow text-sm font-normal text-[#999999]">
          {studentId}
        </div>
        <button>
          <img src="/icons/search.svg" alt="" />
        </button>
        <button className="ml-5">
          <img src="/icons/profile-menu.svg" alt="" />
        </button>
        <button className="ml-5">
          <img src="/icons/hamburger.svg" alt="" />
        </button>
      </div>
      <div className="flex justify-between px-5 pb-5">
        <Link to="/" className="flex flex-col items-center">
          <img src="/icons/globe.svg" alt="" />
          <span className="text-[#767676] font-bold text-[10px]">홈페이지</span>
        </Link>
        <Link to="/library" className="flex flex-col items-center">
          <img src="/icons/library.svg" alt="" />
          <span className="text-[#767676] font-bold text-[10px]">도서관</span>
        </Link>
        <Link to="/clipboard" className="flex flex-col items-center">
          <img src="/icons/clipboard.svg" alt="" />
          <span className="text-[#767676] font-bold text-[10px]">신청현황</span>
        </Link>
        <Link to="/music" className="flex flex-col items-center">
          <img src="/icons/musical-notes-sharp.svg" alt="" />
          <span className="text-[#767676] font-bold text-[10px]">기상송</span>
        </Link>
      </div>
      <div className="pb-6">
        <div ref={emblaQuickRef}>
          <div className="grid grid-flow-col auto-cols-[100%] grid-rows-2 gap-x-8 gap-y-4">
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/points">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    상벌점 누계
                  </div>
                  <div className="font-normal text-[#767676]">
                    이번주는 법정이 없습니다
                  </div>
                </div>
                <div>
                  <Card className="bg-white shadow-[8px_8px_4px_0px_#4300D10D] px-6 py-2 text-[#4300D1] font-semibold text-xs">
                    {points}pt
                  </Card>
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="flex py-5 px-[27px] items-center">
                <div className="flex flex-col grow">
                  <div className="flex items-center text-base font-semibold mb-1">
                    전체공지
                    {newAnnouncement && (
                      <img
                        src="/icons/new.svg"
                        alt=""
                        className="inline-block ml-2"
                      />
                    )}
                  </div>
                  <div className="font-normal text-[#767676]">
                    [5월 치킨알바 공지]
                  </div>
                </div>
                <div>
                  <img src="/icons/notification.svg" alt="" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-5">
          {scrollSnapList.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === selectedIndex ? "bg-[#4300d1]" : "bg-[#dbdbdb]"}`}
            ></div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-8">
        <div className="flex">
          <div className="grow font-semibold text-[22px] leading-none">
            즐겨찾기
          </div>
          <Link
            to="/boards"
            className="flex items-end text-sm font-normal text-[#767676] leading-none"
          >
            더보기
          </Link>
          <div className="flex items-end">
            <img src="/icons/forward.svg" className="ml-1 mb-0.5" alt="" />
          </div>
        </div>
        <div>
          <Card className="grid p-4 w-full gap-4 grid-flow-row grid-cols-[60.5px_1fr_12px]">
            {fivePosts.map((post, i) => (
              <Fragment key={i}>
                <div className="font-semibold text-sm overflow-hidden whitespace-nowrap leading-none">
                  {post.board}
                </div>
                <div className="flex font-normal gap-1.5 max-w-[calc(100vw-22px*2-16px*4-60.5px-12px)] text-sm text-[#767676] leading-none">
                  <div className="min-w-0 shrink whitespace-nowrap overflow-hidden text-ellipsis">
                    {post.title}
                  </div>
                  {post.likes && (
                    <span className="flex shrink-0 gap-0.5">
                      <span>
                        <img src="/icons/like.svg" alt="" />
                      </span>
                      <span className="flex items-end font-semibold text-[10px] text-[#3bbe95] mb-[1px]">
                        {post.likes}
                      </span>
                    </span>
                  )}
                  {post.comments && (
                    <span className="flex shrink-0 gap-0.5">
                      <span>
                        <img src="/icons/comment.svg" alt="" />
                      </span>
                      <span className="flex items-end font-semibold text-[10px] text-[#111111] mb-[1px]">
                        {post.comments}
                      </span>
                    </span>
                  )}
                </div>
                <div>{post.new && <img src="/icons/new.svg" alt="" />}</div>
              </Fragment>
            ))}
          </Card>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex">
          <div className="grow font-semibold text-[22px] leading-none">
            모집공고
          </div>
          <Link
            to="/finds"
            className="flex items-end text-sm font-normal text-[#767676] leading-none"
          >
            더보기
          </Link>
          <div className="flex items-end">
            <img src="/icons/forward.svg" className="ml-1 mb-0.5" alt="" />
          </div>
        </div>
        <div className="flex gap-2">
          {["동아리 공고", "MPT 신청", "스터디그룹"].map((tab, i) => (
            <button
              key={i}
              onClick={() => setSelectedFindTab(i)}
              className={`rounded-full py-[9px] px-4 transition-colors font-semibold text-sm leading-none
        ${
          selectedFindTab === i
            ? "bg-[#3bbe95] text-white"
            : "border-[1px] border-[#111111] text-[#2f2f2f]"
        }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div ref={emblaFindsRef}>
          <div className="flex gap-3">
            {finds[selectedFindTab].map((club, i) => (
              <Card
                className="flex flex-col flex-[0_0_140px] min-w-0 shrink-0 overflow-hidden"
                key={i}
              >
                <img
                  src={club.imageUrl}
                  alt={club.name}
                  className="w-full h-25 object-cover object-center"
                />
                <div className="flex flex-col px-2.5 py-3 gap-0.5">
                  <div className="font-medium text-[12px] text-[#111111]">
                    {club.name}
                  </div>
                  <div className="font-normal text-[12px] text-[#767676] leading-4">
                    {club.description}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Post = {
  board: string;
  title: string;
  likes?: number;
  comments?: number;
  new?: boolean;
};

type Club = {
  name: string;
  description: string;
  imageUrl: string;
};
