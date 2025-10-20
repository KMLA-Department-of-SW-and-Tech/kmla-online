import { useCallback, useRef } from "react";

export function useChatScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: behavior,
    });
  }, []);

  return { containerRef, scrollToBottom };
}
