// 같은 채팅방에서 다른 유저네임으로 접속할 수 있는 테스트용 페이지, 배포할 땐 지울 것

import { Link } from "react-router";
import { RealtimeChat } from "~/components/realtime-chat";

export default function ChatPage() {
  const roomName = "jigangjon-changman";
  const username = "창운";
  const roomImageUrl = `https://picsum.photos/id/238/400/300`;
  const headerBackgroundColor = "bg-[#ffffff]";

  return (
    <div className="w-full h-screen min-h-screen flex flex-col">
      <div
        className={`flex flex-row px-4 py-3 items-center sticky top-0 z-10 ${headerBackgroundColor}`}
      >
        <Link to="/" className="mr-3">
          <img src="/back-button.svg" alt="" />
        </Link>
        <img
          src={roomImageUrl}
          className="w-9 h-9 rounded-full mr-2.5"
          alt="chat room icon"
        />
        <div>Jigang Jon</div>
      </div>
      <RealtimeChat roomName={roomName} username={username} />
    </div>
  );
}
