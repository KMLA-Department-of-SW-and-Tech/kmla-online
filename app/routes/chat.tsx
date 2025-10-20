import { Link } from "react-router";
import { RealtimeChat } from "~/components/realtime-chat";
import supabase from "~/lib/supabase/client";

// TODO: 언제 보낸 시간 뜨게 할지 결하기
// TODO: icon, bg color 등 디자인 통일하기
// TODO: roomName, username, userImageUrl, roomImageUrl 등 백엔드에서 받아오기
// TODO: language support, dark mode support
// TODO: edit message, delete message 기능 추가
// TODO: initial scroll to bottom이 끝까지 안 내려감. realtime-chat Form element에 sticky 때문인 듯
// NOTE: shadcn realtimechat ui가 처음에 로딩할 때 인풋 로딩하는 시간이 너무 오래 걸리는데 왜 그런지 모르겠음
// NOTE: 나중에 디자인 바꿔야 할 때 shadcn components 코드랑 app.css 참고해서 바꾸기

export default function ChatPage() {
  const roomName = "jigangjon-changman";
  const username = "Jigang Jon";
  const roomImageUrl = `https://picsum.photos/id/237/400/300`;
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
        <div>창운</div>
      </div>
      <RealtimeChat roomName={roomName} username={username} />
    </div>
  );
}
