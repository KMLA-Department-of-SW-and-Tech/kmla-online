import { Link } from "react-router";
import { RealtimeChat } from "~/components/realtime-chat";

// TODO: 언제 보낸 시간 뜨게 할지 결하기
// TODO: icon, bg color 등 디자인 통일하기
// TODO: roomName, username, userImageUrl, roomImageUrl 등 백엔드에서 받아오기
// TODO: language support, dark mode support
// NOTE: shadcn realtimechat ui가 처음에 로딩할 때 인풋 로딩하는 시간이 너무 오래 걸리는데 왜 그런지 모르겠음
// NOTE: 나중에 디자인 바꿔야 할 때 shadcn components 코드랑 app.css 참고해서 바꾸기

export default function ChatPage() {
  const roomName = "정창운";
  const username = "Jigang Jon";
  const roomImageUrl = `https://picsum.photos/id/237/400/300`;
  const senderImageUrl = `https://picsum.photos/id/238/400/300`;
  const headerBackgroundColor = "bg-[#ffffff]";

  const messages = [
    {
      id: "1",
      content: "Hello",
      user: {
        name: "창운",
        avatarUrl: senderImageUrl,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.",
      user: {
        name: username,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.",
      user: {
        name: "창운",
        avatarUrl: senderImageUrl,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      content:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      user: {
        name: "창운",
        avatarUrl: senderImageUrl,
      },
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col">
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
        <div>{roomName}</div>
      </div>
      <RealtimeChat
        roomName={roomName}
        username={username}
        messages={messages}
      />
    </div>
  );
}
