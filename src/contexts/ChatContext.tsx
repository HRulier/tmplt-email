"use client";

import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";
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

const STORAGE_KEY = "emailgen:chat:messages";
const STORAGE_FILES_KEY = "emailgen:chat:files";
const STORAGE_FIELDS_KEY = "emailgen:chat:fields";

function loadMessages(): AppUIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppUIMessage[]) : [];
  } catch {
    return [];
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { files, setFiles, setFields } = useFileSystem();
  const filesRef = useRef(files);
  filesRef.current = files;
  const [lastFinishedAt, setLastFinishedAt] = useState(0);

  // Rehydrate VFS and fields from localStorage on first mount
  useEffect(() => {
    const savedFiles = loadFromStorage<SerializedVFS>(STORAGE_FILES_KEY, {});
    const savedFields = loadFromStorage<FieldDef[]>(STORAGE_FIELDS_KEY, []);
    if (Object.keys(savedFiles).length > 0) setFiles(savedFiles);
    if (savedFields.length > 0) setFields(savedFields);
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        localStorage.setItem(STORAGE_FIELDS_KEY, JSON.stringify(fields));
      }
    },
    [setFields]
  );

  const { messages, status, error, sendMessage, stop, setMessages } =
    useChat<AppUIMessage>({
      messages: loadMessages(),
      transport: transportRef.current,
      onToolCall: handleToolCall,
      onFinish: ({ message, messages: allMessages }) => {
        const snapshot = message.metadata?.vfsSnapshot;
        if (snapshot) {
          setFiles(snapshot);
          localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(snapshot));
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allMessages));
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
