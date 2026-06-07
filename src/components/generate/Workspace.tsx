"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useChatContext } from "@/contexts/ChatContext";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import styles from "./Workspace.module.css";

type Tab = "code" | "preview";

function SaveDialog({
  onSave,
  onCancel,
}: {
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.dialog}>
        <p className={styles.dialogTitle}>Save template</p>
        <input
          ref={inputRef}
          className={styles.dialogInput}
          placeholder="Template name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {error && <p className={styles.dialogError}>{error}</p>}
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancel} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className={styles.dialogConfirm}
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Workspace() {
  const { files, fields } = useFileSystem();
  const { lastFinishedAt } = useChatContext();
  const router = useRouter();
  const filePaths = Object.values(files)
    .filter((n) => n.type === "file")
    .map((n) => n.path)
    .sort();

  const [tab, setTab] = useState<Tab>("code");
  const [selected, setSelected] = useState<string | null>(null);
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    if (!selected && filePaths.includes("/Email.tsx")) {
      setSelected("/Email.tsx");
    } else if (!selected && filePaths.length > 0) {
      setSelected(filePaths[0]);
    }
  }, [filePaths, selected]);

  useEffect(() => {
    if (filePaths.includes("/Email.tsx") && tab === "code") {
      setTab("preview");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePaths.length > 0]);

  const handleSave = async (name: string) => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, files, fields }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    // Clear localStorage after successful save
    localStorage.removeItem("emailgen:chat:messages");
    localStorage.removeItem("emailgen:chat:files");
    localStorage.removeItem("emailgen:chat:fields");
    router.push("/dashboard");
  };

  if (filePaths.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>✉</span>
        <span>Generated files will appear here</span>
      </div>
    );
  }

  const content = selected ? (files[selected]?.content ?? null) : null;

  return (
    <>
      {showSave && (
        <SaveDialog onSave={handleSave} onCancel={() => setShowSave(false)} />
      )}

      <div className={styles.tabs}>
        <button
          className={styles.tab}
          data-active={tab === "code" ? "true" : "false"}
          onClick={() => setTab("code")}
        >
          Code
        </button>
        <button
          className={styles.tab}
          data-active={tab === "preview" ? "true" : "false"}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
        <div className={styles.tabSpacer} />
        <button className={styles.saveBtn} onClick={() => setShowSave(true)}>
          Save template
        </button>
      </div>

      {tab === "preview" ? (
        <EmailPreviewFrame files={files} lastFinishedAt={lastFinishedAt} />
      ) : (
        <div className={styles.split}>
          <nav className={styles.tree}>
            {filePaths.map((path) => (
              <button
                key={path}
                className={styles.treeItem}
                data-active={path === selected ? "true" : "false"}
                onClick={() => setSelected(path)}
              >
                <span className={styles.treeIcon}>
                  {path.endsWith(".tsx") || path.endsWith(".ts") ? "TS" : "📄"}
                </span>
                <span className={styles.treeLabel}>{path.replace(/^\//, "")}</span>
              </button>
            ))}
          </nav>

          <div className={styles.viewer}>
            {content !== null ? (
              <pre className={styles.code}>{content}</pre>
            ) : (
              <p className={styles.noFile}>Select a file to view its content.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
