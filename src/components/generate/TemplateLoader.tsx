"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFileSystem } from "@/contexts/FileSystemContext";
import type { SerializedVFS, FieldDef } from "@/types";

const STORAGE_KEY = "emailgen:chat:messages";
const STORAGE_FILES_KEY = "emailgen:chat:files";
const STORAGE_FIELDS_KEY = "emailgen:chat:fields";

export function TemplateLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const { setFiles, setFields } = useFileSystem();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!templateId || loadedRef.current) return;
    loadedRef.current = true;

    // Clear any stale localStorage session before loading the saved template
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_FILES_KEY);
    localStorage.removeItem(STORAGE_FIELDS_KEY);

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
