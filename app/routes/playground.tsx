import { Link } from "react-router";
import Card from "~/components/ui/card";

export default function Playground() {
  const newAnnouncement = true;
  return (
    <div>
      <div className="w-full overflow-x-scroll snap-x snap-mandatory flex scrollbar-hide">
        <Link className="snap-center flex-shrink-0 w-full" to="/announcements">
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
        <Link className="snap-center flex-shrink-0 w-full" to="/points">
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
                34pt
              </Card>
            </div>
          </Card>
        </Link>
      </div>
      <div className="flex justify-center gap-2 mt-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
}
