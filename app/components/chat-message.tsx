import { cn } from "~/lib/utils";
import type { ChatMessage } from "~/hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  return (
    <div
      className={`flex mt-2 w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={cn("max-w-[67%] flex flex-col gap-1 min-w-0 self-auto", {
          "items-end": isOwnMessage,
          "items-start": !isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "inline-flex py-2 px-3 rounded-xl text-sm min-w-0 whitespace-normal break-words [word-break:break-word] max-w-full",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
