import { cn } from "~/lib/utils";
import { ChatMessageItem } from "~/components/chat-message";
import { useChatScroll } from "~/hooks/use-chat-scroll";
import { type ChatMessage, useRealtimeChat } from "~/hooks/use-realtime-chat";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IconFileInput from "./icon-file-input";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();
  const hasScrolledRef = useRef(false);

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  });
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    if (allMessages.length > 0 && !hasScrolledRef.current) {
      scrollToBottom("instant");
      hasScrolledRef.current = true;
    }
    console.log("Scrolled to bottom");
  }, [allMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      setNewMessage("");
      setAttachment(null);
      sendMessage(newMessage, attachment);
      scrollToBottom("instant");
    },
    [newMessage, isConnected, sendMessage, attachment]
  );

  return (
    <div
      className={`flex flex-col h-full w-full bg-background text-foreground antialiased`}
    >
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const nextMessage =
              index < allMessages.length - 1 ? allMessages[index + 1] : null;
            const showSender =
              message.user.name !== username &&
              prevMessage?.user.name !== message.user.name;
            const showAvatar =
              message.user.name !== username &&
              (nextMessage?.user.name !== message.user.name ||
                nextMessage == null);

            const showTimestamp = prevMessage
              ? isDifferentMinutes(
                  new Date(message.createdAt),
                  new Date(prevMessage.createdAt)
                )
              : true;

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showSender={showSender}
                  showTimestamp={showTimestamp}
                  showAvatar={showAvatar}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="flex w-full bg-background sticky bottom-0 z-10 gap-2 border-t border-border p-4"
      >
        <div className="relative">
          <IconFileInput
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="bg-[#3BBE95] rounded-full w-9 flex items-center justify-center"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.73425 18.3451V10.3451H0.734253V8.34509H8.73425V0.345093H10.7343V8.34509H18.7343V10.3451H10.7343V18.3451H8.73425Z"
                fill="#ffffff"
              />
            </svg>
          </IconFileInput>
          {attachment && (
            <div className="absolute top-[1px] right-[1px] bg-orange-600 text-white rounded-full w-2 h-2"></div>
          )}
        </div>
        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300",
            isConnected && newMessage.trim() ? "w-[calc(100%-36px)]" : "w-full"
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
};

function isDifferentMinutes(date1: Date, date2: Date) {
  const minutes1 = Math.floor(date1.getTime() / 60000);
  const minutes2 = Math.floor(date2.getTime() / 60000);
  return minutes1 !== minutes2;
}
