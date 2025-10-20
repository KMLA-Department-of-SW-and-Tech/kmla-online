import { RealtimeChat } from "~/components/realtime-chat";

export default function ChatTestPage() {
  return (
    <RealtimeChat roomName="test-room" username="test-user" messages={[]} />
  );
}
