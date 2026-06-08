"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFileSystem } from "@/contexts/FileSystemContext";
import type { SerializedVFS, FieldDef } from "@/types";

export function TemplateLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const { setFiles, setFields, setSavedFieldValues } = useFileSystem();
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
        setFiles(data.files);
        setFields(data.fields);
        setSavedFieldValues(data.fieldValues ?? {});
      })
      .catch(console.error);
  }, [templateId, setFiles, setFields, setSavedFieldValues]);

  return <>{children}</>;
}
