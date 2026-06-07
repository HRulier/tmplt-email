"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFileSystem } from "@/contexts/FileSystemContext";
import type { SerializedVFS, FieldDef } from "@/types";

const STORAGE_KEY = "emailgen:chat:messages";
const STORAGE_FILES_KEY = "emailgen:chat:files";
const STORAGE_FIELDS_KEY = "emailgen:chat:fields";

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_FILES_KEY);
  localStorage.removeItem(STORAGE_FIELDS_KEY);
}

export function TemplateLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const { setFiles, setFields } = useFileSystem();
  const loadedRef = useRef(false);

  // Clear localStorage synchronously during render, before any child useEffect runs.
  // This prevents ChatProvider from rehydrating stale files from a previous session.
  const clearedRef = useRef(false);
  if (!clearedRef.current) {
    clearedRef.current = true;
    clearSession();
  }

  useEffect(() => {
    if (!templateId || loadedRef.current) return;
    loadedRef.current = true;

    fetch(`/api/templates/${templateId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: { files: SerializedVFS; fields: FieldDef[] }) => {
        setFiles(data.files);
        setFields(data.fields);
        // Seed localStorage so ChatProvider rehydrates correctly
        localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(data.files));
        localStorage.setItem(STORAGE_FIELDS_KEY, JSON.stringify(data.fields));
      })
      .catch(console.error);
  }, [templateId, setFiles, setFields]);

  return <>{children}</>;
}
