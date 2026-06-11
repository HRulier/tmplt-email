"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SerializedVFS } from "@/types";
import styles from "./EmailPreviewFrame.module.css";

interface Props {
  files: SerializedVFS;
  fieldValues?: Record<string, string>;
  lastFinishedAt: number;
  onLoadingChange?: (loading: boolean) => void;
  onFetchReady?: (fn: () => void) => void;
}

export function EmailPreviewFrame({
  files,
  fieldValues = {},
  lastFinishedAt,
  onLoadingChange,
  onFetchReady,
}: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      if (!res.ok) {
        const { error: msg } = await res.json() as { error: string };
        setError(msg);
      } else {
        setError(null);
        setHtml(await res.text());
      }
    } finally {
      pendingRef.current = false;
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  // Expose fetchPreview to parent
  useEffect(() => {
    onFetchReady?.(fetchPreview);
  }, [fetchPreview, onFetchReady]);

  // Trigger when Claude finishes a generation turn
  useEffect(() => {
    if (lastFinishedAt === 0) return;
    fetchPreview();
  }, [lastFinishedAt, fetchPreview]);

  // Initial render when loading an existing template — fires once when files arrive.
  // Since files + fieldValues are now set atomically, no fieldValuesReady guard needed.
  const didInitRef = useRef(false);
  const hasFiles = Object.values(files).some((n) => n.type === "file");
  useEffect(() => {
    if (didInitRef.current || !hasFiles) return;
    didInitRef.current = true;
    fetchPreview();
  }, [hasFiles, fetchPreview]);

  // Auto-resize iframe to match its content height
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc) iframe.style.height = doc.documentElement.scrollHeight + "px";
    } catch {
      // cross-origin — leave default height
    }
  };

  if (!hasFiles) return null;

  return (
    <div className={styles.wrapper}>
      {error ? (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠</span>
          <p className={styles.errorTitle}>Le template contient des erreurs</p>
          <p className={styles.errorHint}>L&apos;IA va corriger automatiquement au prochain message.</p>
        </div>
      ) : html !== null ? (
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
          Rendu en cours…
        </div>
      )}
    </div>
  );
}
