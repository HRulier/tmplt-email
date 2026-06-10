"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { FieldDef, SerializedVFS } from "@/types";

type VfsMeta = { vfsSnapshot?: SerializedVFS };
export type AppUIMessage = UIMessage<VfsMeta>;
type ChatHelpers = ReturnType<typeof useChat<AppUIMessage>>;

export interface TemplateFS {
  files: SerializedVFS;
  fields: FieldDef[];
  savedFieldValues: Record<string, string>;
}

const EMPTY_FS: TemplateFS = { files: {}, fields: [], savedFieldValues: {} };

interface TemplateContextValue {
  fs: TemplateFS;
  setFS: (next: TemplateFS) => void;
  setFiles: (files: SerializedVFS) => void;
  setFields: (fields: FieldDef[]) => void;
  messages: AppUIMessage[];
  status: ChatHelpers["status"];
  error: ChatHelpers["error"];
  sendMessage: ChatHelpers["sendMessage"];
  stop: ChatHelpers["stop"];
  setMessages: ChatHelpers["setMessages"];
  lastFinishedAt: number;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

class FilesStore {
  files: SerializedVFS = {};
  update(files: SerializedVFS) { this.files = files; }
}

function makeTransport(store: FilesStore) {
  return new DefaultChatTransport<AppUIMessage>({
    api: "/api/chat",
    fetch: async (input, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return fetch(input, {
        ...init,
        body: JSON.stringify({ ...body, files: store.files }),
      });
    },
  });
}

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [fs, setFS] = useState<TemplateFS>(EMPTY_FS);

  const setFiles = useCallback(
    (files: SerializedVFS) => setFS((prev) => ({ ...prev, files })),
    [],
  );
  const setFields = useCallback(
    (fields: FieldDef[]) => setFS((prev) => ({ ...prev, fields })),
    [],
  );

  // load existing template on mount — single atomic setState
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!templateId || loadedRef.current) return;
    loadedRef.current = true;
    fetch(`/api/templates/${templateId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: { files: SerializedVFS; fields: FieldDef[]; fieldValues: Record<string, string> }) => {
        setFS({
          files: data.files,
          fields: data.fields,
          savedFieldValues: data.fieldValues ?? {},
        });
      })
      .catch(console.error);
  }, [templateId]);

  // chat
  const [lastFinishedAt, setLastFinishedAt] = useState(0);

  // store and transport are created once per provider instance via useMemo.
  // store.files is updated in an effect and only read inside the async fetch
  // callback — never during render.
  const { store, transport } = useMemo(() => {
    const store = new FilesStore();
    return { store, transport: makeTransport(store) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    store.update(fs.files);
  }, [store, fs.files]);

  const handleToolCall = useCallback(
    ({ toolCall }: { toolCall: { toolName: string; input: unknown } }) => {
      if (
        toolCall.toolName === "extract_fields" &&
        toolCall.input &&
        typeof toolCall.input === "object" &&
        "fields" in toolCall.input
      ) {
        setFields((toolCall.input as { fields: FieldDef[] }).fields);
      }
    },
    [setFields],
  );

  const { messages, status, error, sendMessage, stop, setMessages } =
    useChat<AppUIMessage>({
      transport,
      onToolCall: handleToolCall,
      onFinish: ({ message }) => {
        const snapshot = message.metadata?.vfsSnapshot;
        if (snapshot) setFiles(snapshot);
        setLastFinishedAt(Date.now());
      },
    });

  return (
    <TemplateContext.Provider
      value={{
        fs,
        setFS,
        setFiles,
        setFields,
        messages,
        status,
        error,
        sendMessage,
        stop,
        setMessages,
        lastFinishedAt,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplate must be used inside TemplateProvider");
  return ctx;
}
