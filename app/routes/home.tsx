import type { Route } from "./+types/home";
import Card from "~/components/ui/card";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({}: Route.LoaderArgs) {
  const newAnnouncement = true;
  const points = 34;
  return { newAnnouncement, points };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const studentName = "박강현";
  const studentId = "231045";
  const { newAnnouncement, points } = loaderData;
  return (
    <div className="flex flex-col pt-8 px-5.5 gap-y-4">
      <div className="flex">
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
      <div className="flex justify-between px-5">
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
      <div>
        <Link to="/announcements">
          <Card className="flex py-5 px-[27px] items-center mb-4">
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
          <Card className="flex py-5 px-[27px] items-center mb-4">
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
        <div>nav</div>
      </div>
      <div>
        <div>즐겨찾기</div>
        <Card>더보기{">"}</Card>
      </div>
      <div>
        <div>boards</div>
      </div>
      <div>
        <div>즐겨찾기</div>
        <div>더보기{">"}</div>
      </div>
      <div>
        <div>동아리 공고</div>
        <div>MPT 신청</div>
        <div>스터디그룹</div>
      </div>
      <div>
        <Card>post1</Card>
        <Card>post2</Card>
        <Card>post3</Card>
      </div>
    </div>
  );
}
