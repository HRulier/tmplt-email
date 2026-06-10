"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { FieldDef, SerializedVFS } from "@/types";

type VfsMeta = { vfsSnapshot?: SerializedVFS };
export type AppUIMessage = UIMessage<VfsMeta>;
type ChatHelpers = ReturnType<typeof useChat<AppUIMessage>>;

interface TemplateContextValue {
  // file system
  files: SerializedVFS;
  fields: FieldDef[];
  savedFieldValues: Record<string, string>;
  setFiles: (files: SerializedVFS) => void;
  setFields: (fields: FieldDef[]) => void;
  setSavedFieldValues: (values: Record<string, string>) => void;
  // chat
  messages: AppUIMessage[];
  status: ChatHelpers["status"];
  error: ChatHelpers["error"];
  sendMessage: ChatHelpers["sendMessage"];
  stop: ChatHelpers["stop"];
  setMessages: ChatHelpers["setMessages"];
  lastFinishedAt: number;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  // file system state
  const [files, setFilesState] = useState<SerializedVFS>({});
  const [fields, setFieldsState] = useState<FieldDef[]>([]);
  const [savedFieldValues, setSavedFieldValuesState] = useState<
    Record<string, string>
  >({});

  const setFiles = useCallback(
    (next: SerializedVFS) => setFilesState(next),
    [],
  );
  const setFields = useCallback((next: FieldDef[]) => setFieldsState(next), []);
  const setSavedFieldValues = useCallback(
    (next: Record<string, string>) => setSavedFieldValuesState(next),
    [],
  );

  // load existing template on mount
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!templateId || loadedRef.current) return;
    loadedRef.current = true;
    fetch(`/api/templates/${templateId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(
        (data: {
          files: SerializedVFS;
          fields: FieldDef[];
          fieldValues: Record<string, string>;
        }) => {
          setFiles(data.files);
          setFields(data.fields);
          setSavedFieldValues(data.fieldValues ?? {});
        },
      )
      .catch(console.error);
  }, [templateId, setFiles, setFields, setSavedFieldValues]);

  // chat state
  const [lastFinishedAt, setLastFinishedAt] = useState(0);
  const filesRef = useRef(files);

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
    }),
  );

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
      transport: transportRef.current,
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
        files,
        fields,
        savedFieldValues,
        setFiles,
        setFields,
        setSavedFieldValues,
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
