"use client";

import { createClient } from "~/lib/supabase/client";
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
    async (content: string) => {
      if (!channel || !isConnected) return;

      const message = {
        content,
        user: {
          name: username,
        },
      };

      const currentMessage = {
        ...message,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      // Update local state immediately for the sender
      // setMessages((current) => [...current, currentMessage]);

      const { data, error } = await supabase.from("messages").insert(message);
      if (error) {
        console.error("Error saving message to database:", error);
      }

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
