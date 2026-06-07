"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SerializedVFS } from "@/types";
import styles from "./EmailPreviewFrame.module.css";

interface Props {
  files: SerializedVFS;
  fieldValues?: Record<string, string>;
  lastFinishedAt: number;
}

export function EmailPreviewFrame({ files, fieldValues = {}, lastFinishedAt }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);
  const filesRef = useRef(files);
  filesRef.current = files;
  const fieldValuesRef = useRef(fieldValues);
  fieldValuesRef.current = fieldValues;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPreview = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesRef.current, fieldValues: fieldValuesRef.current }),
      });
      setHtml(await res.text());
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Trigger when Claude finishes a generation turn
  useEffect(() => {
    if (lastFinishedAt === 0) return;
    fetchPreview();
  }, [lastFinishedAt, fetchPreview]);

  // Trigger once when a saved template is loaded
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    const hasFiles = Object.values(files).some((n) => n.type === "file");
    if (!hasFiles) return;
    didInitRef.current = true;
    fetchPreview();
  }, [files, fetchPreview]);

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
      <div className={styles.toolbar}>
        <span className={styles.dot} data-loading={String(loading)} />
        <span>{loading ? "Rendering…" : "Preview"}</span>
        <button className={styles.refreshBtn} onClick={fetchPreview} disabled={loading}>
          Refresh
        </button>
      </div>

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
