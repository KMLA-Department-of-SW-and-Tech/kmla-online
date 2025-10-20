import { RealtimeChat } from "~/components/realtime-chat";

export default function ChatPage() {
  const roomName = "test-room";
  const username = "test-user";
  const roomImageUrl = `https://picsum.photos/id/237/400/300`;
  const userImageUrl = `https://picsum.photos/400/300`;
  const headerBackgroundColor = "#ffffff";

  const messages = [
    {
      id: "1",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.",
      user: {
        name: username,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      content: "Hello",
      user: {
        name: "another-user",
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.",
      user: {
        name: "another-user",
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      content:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      user: {
        name: "another-user",
      },
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div>
      <div className={`flex ${headerBackgroundColor}`}>
        <div>a</div>
        <div>
          <img src={roomImageUrl} alt="" />
        </div>
        <div>{username}</div>
      </div>
      <RealtimeChat
        roomName={roomName}
        username={username}
        messages={messages}
      />
    </div>
  );
}
