import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Card from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const studentName = "박강현";
  const studentId = "231045";
  return (
    <div className="flex flex-col">
      <div className="flex">
        <div>{studentName}</div>
        <div>{studentId}</div>
        <button>search</button>
        <button>user</button>
        <button>hamburger</button>
      </div>
      <div>
        <div>홈페이지</div>
        <div>도서관</div>
        <div>신청현황</div>
        <div>기상송</div>
      </div>
      <div>
        <Card>notification1</Card>
        <Card>notification2</Card>
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
