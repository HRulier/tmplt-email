"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SerializedVFS } from "@/types";
import styles from "./EmailPreviewFrame.module.css";

interface Props {
  files: SerializedVFS;
  fieldValues?: Record<string, string>;
  fieldValuesReady: boolean;
  lastFinishedAt: number;
  onLoadingChange?: (loading: boolean) => void;
  onFetchReady?: (fn: () => void) => void;
}

export function EmailPreviewFrame({
  files,
  fieldValues = {},
  fieldValuesReady,
  lastFinishedAt,
  onLoadingChange,
  onFetchReady,
}: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const filesRef = useRef(files);
  filesRef.current = files;
  const fieldValuesRef = useRef(fieldValues);
  fieldValuesRef.current = fieldValues;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPreview = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    onLoadingChange?.(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesRef.current,
          fieldValues: fieldValuesRef.current,
        }),
      });
      setHtml(await res.text());
    } finally {
      pendingRef.current = false;
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  // Expose fetchPreview to parent once ready
  useEffect(() => {
    onFetchReady?.(fetchPreview);
  }, [fetchPreview, onFetchReady]);

  // Trigger when Claude finishes a generation turn
  useEffect(() => {
    if (lastFinishedAt === 0) return;
    fetchPreview();
  }, [lastFinishedAt, fetchPreview]);

  // Trigger once when files + fieldValues are both ready.
  // fieldValuesReady is set by Workspace after seeding from saved DB values,
  // ensuring the first preview render always uses the correct field values.
  const didInitRef = useRef(false);
  const hasFiles = Object.values(files).some((n) => n.type === "file");
  useEffect(() => {
    if (didInitRef.current) return;
    if (!hasFiles || !fieldValuesReady) return;
    didInitRef.current = true;
    fetchPreview();
  }, [hasFiles, fieldValuesReady, fetchPreview]);

  // Auto-resize iframe to match its content height
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        iframe.style.height = doc.documentElement.scrollHeight + "px";
      }
    } catch {
      // cross-origin — leave default height
    }
  };

  if (!Object.values(files).some((n) => n.type === "file")) return null;

  return (
    <div className={styles.wrapper}>
      {html !== null ? (
        <div className={styles.frameWrap}>
          <iframe
            ref={iframeRef}
            className={styles.frame}
            srcDoc={html}
            sandbox="allow-same-origin"
            title="Email preview"
            onLoad={handleIframeLoad}
          />
        </div>
      ) : (
        <div className={styles.loading}>
          <span className={styles.dot} data-loading="true" />
          Rendering preview…
        </div>
      )}
    </div>
  );
}
