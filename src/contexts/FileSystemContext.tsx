"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { SerializedVFS, FieldDef } from "@/types";

interface FileSystemContextValue {
  files: SerializedVFS;
  fields: FieldDef[];
  savedFieldValues: Record<string, string>;
  setFiles: (files: SerializedVFS) => void;
  setFields: (fields: FieldDef[]) => void;
  setSavedFieldValues: (values: Record<string, string>) => void;
  reset: () => void;
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [files, setFilesState] = useState<SerializedVFS>({});
  const [fields, setFieldsState] = useState<FieldDef[]>([]);
  const [savedFieldValues, setSavedFieldValuesState] = useState<Record<string, string>>({});

  const setFiles = useCallback((next: SerializedVFS) => setFilesState(next), []);
  const setFields = useCallback((next: FieldDef[]) => setFieldsState(next), []);
  const setSavedFieldValues = useCallback((next: Record<string, string>) => setSavedFieldValuesState(next), []);
  const reset = useCallback(() => {
    setFilesState({});
    setFieldsState([]);
    setSavedFieldValuesState({});
  }, []);

  return (
    <FileSystemContext.Provider value={{ files, fields, savedFieldValues, setFiles, setFields, setSavedFieldValues, reset }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error("useFileSystem must be used inside FileSystemProvider");
  return ctx;
}
