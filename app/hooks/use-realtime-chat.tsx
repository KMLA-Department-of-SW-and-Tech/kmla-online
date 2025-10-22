"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "~/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js/dist/module/RealtimeChannel";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  attachmentUrl?: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

const EVENT_MESSAGE_TYPE = "message";

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMessages = async () => {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .order("createdAt");
    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    setMessages(messages);
  };

  const handleRealtimeInsert = async (
    payload: RealtimePostgresChangesPayload<{
      [key: string]: any;
    }>
  ) => {
    const { new: newMessage } = payload;
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    const newChannel = supabase.channel(roomName);

    newChannel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              handleRealtimeInsert(payload);
              break;
            case "UPDATE":
              break;
            case "DELETE":
              break;
            default:
              break;
          }
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    fetchMessages();

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomName, username, supabase]);

  const sendMessage = useCallback(
    async (content: string, attachment: File | null) => {
      if (!channel || !isConnected) return;

      const attachmentUrl = `${roomName}/${attachment?.name}`;
      const message = {
        content,
        user: {
          name: username,
        },
        ...(attachment && { attachmentUrl }),
      };

      const currentMessage = {
        ...message,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      // Update local state immediately for the sender
      // currentMessage의 id랑 supabase에서 생성된 id랑 달라서 같은 메시지가 중복으로 보이는 현상 발생해서 주석 처리함
      // TODO: immediate local state update하면서도 중복 문제 해결하기
      // setMessages((current) => [...current, currentMessage]);

      await supabase.from("messages").insert(message);

      if (attachment)
        await supabase.storage
          .from("chat-message-attachments")
          .upload(attachmentUrl, attachment);

      await channel.send({
        type: "broadcast",
        event: EVENT_MESSAGE_TYPE,
        payload: currentMessage,
      });
    },
    [channel, isConnected, username]
  );

  return { messages, sendMessage, isConnected };
}
