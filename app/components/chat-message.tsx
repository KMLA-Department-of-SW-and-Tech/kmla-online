import { cn } from "~/lib/utils";
import type { ChatMessage } from "~/hooks/use-realtime-chat";
import { useState } from "react";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showSender: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showSender,
  showTimestamp,
  showAvatar,
}: ChatMessageItemProps) => {
  const [isTouched, setIsTouched] = useState(false);

  const handlePointerUp = () => {
    setIsTouched((prev) => !prev);
  };

  return (
    <div className={`flex mt-2 w-full`}>
      <div className="w-full flex flex-col gap-1 self-auto items-stretch">
        {(showTimestamp || isTouched) && (
          <span className="text-[#767676] text-xs self-center my-2">
            {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </span>
        )}
        {showSender && (
          <div className="flex items-center gap-2 text-xs px-3">
            <div className="w-[8vw]"></div>
            <span className="font-medium text-[#767676]">
              {message.user.name}
            </span>
          </div>
        )}
        <div
          className={cn("flex items-end gap-2", {
            "flex-row-reverse": isOwnMessage,
          })}
        >
          {isOwnMessage || (
            <div className="w-[8vw] h-[8vw]">
              {showAvatar && (
                <img
                  src={message.user.avatarUrl}
                  className="w-full h-full rounded-full"
                  alt="user avatar"
                />
              )}
            </div>
          )}
          <div
            className={cn(
              "max-w-[67%] inline-flex py-2 px-3 rounded-xl text-sm min-w-0 whitespace-normal break-words [word-break:break-word]",
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
            onPointerUp={handlePointerUp}
          >
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
};
