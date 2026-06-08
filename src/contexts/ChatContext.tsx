"use client";

import { createContext, useContext, useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useFileSystem } from "./FileSystemContext";
import type { FieldDef, SerializedVFS } from "@/types";

type VfsMeta = { vfsSnapshot?: SerializedVFS };
type AppUIMessage = UIMessage<VfsMeta>;

type ChatHelpers = ReturnType<typeof useChat<AppUIMessage>>;

interface ChatContextValue {
  messages: AppUIMessage[];
  status: ChatHelpers["status"];
  error: ChatHelpers["error"];
  sendMessage: ChatHelpers["sendMessage"];
  stop: ChatHelpers["stop"];
  setMessages: ChatHelpers["setMessages"];
  lastFinishedAt: number;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { files, setFiles, setFields } = useFileSystem();
  const filesRef = useRef(files);
  filesRef.current = files;
  const [lastFinishedAt, setLastFinishedAt] = useState(0);

  const transportRef = useRef(
    new DefaultChatTransport<AppUIMessage>({
      api: "/api/chat",
      fetch: async (input, init) => {
        const body = JSON.parse((init?.body as string) ?? "{}");
        return fetch(input, {
          ...init,
          body: JSON.stringify({ ...body, files: filesRef.current }),
        });
      },
    })
  );

  const handleToolCall = useCallback(
    ({ toolCall }: { toolCall: { toolName: string; input: unknown } }) => {
      if (
        toolCall.toolName === "extract_fields" &&
        toolCall.input &&
        typeof toolCall.input === "object" &&
        "fields" in toolCall.input
      ) {
        const fields = (toolCall.input as { fields: FieldDef[] }).fields;
        setFields(fields);
      }
    },
    [setFields]
  );

  const { messages, status, error, sendMessage, stop, setMessages } =
    useChat<AppUIMessage>({
      transport: transportRef.current,
      onToolCall: handleToolCall,
      onFinish: ({ message }) => {
        const snapshot = message.metadata?.vfsSnapshot;
        if (snapshot) {
          setFiles(snapshot);
        }
        setLastFinishedAt(Date.now());
      },
    });

  return (
    <ChatContext.Provider value={{ messages, status, error, sendMessage, stop, setMessages, lastFinishedAt }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}
