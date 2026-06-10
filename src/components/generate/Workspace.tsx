"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TbMail } from "react-icons/tb";
import { useTemplate } from "@/contexts/TemplateContext";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { FieldEditorSidebar } from "./FieldEditorSidebar";
import styles from "./Workspace.module.css";
import type { FieldDef } from "@/types";

type Tab = "code" | "preview";

function extractTemplateName(
  messages: { role: string; parts?: Array<{ type: string; text?: string }> }[],
): string {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts?.find((p) => p.type === "text")?.text ?? "Untitled";
  return text.slice(0, 60).trim();
}

function buildDefaults(
  fields: FieldDef[],
  savedFieldValues: Record<string, string>,
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const f of fields) defaults[f.id] = f.defaultValue;
  return { ...defaults, ...savedFieldValues };
}

export function Workspace() {
  const { fs, messages, lastFinishedAt } = useTemplate();
  const { files, fields, savedFieldValues } = fs;
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdRef = useRef<string | null>(searchParams.get("template"));

  const filePaths = useMemo(
    () =>
      Object.values(files)
        .filter((n) => n.type === "file")
        .map((n) => n.path)
        .sort(),
    [files],
  );

  const fieldDefaults = useMemo(
    () => buildDefaults(fields, savedFieldValues),
    [fields, savedFieldValues],
  );

  // fieldOverrides resets whenever the field set identity changes (new generation or template load)
  const fieldsId = fields.map((f) => f.id).join(",");
  const [overridesForFields, setOverridesForFields] = useState<{
    fieldsId: string;
    values: Record<string, string>;
  }>({ fieldsId, values: {} });

  const fieldOverrides = useMemo(
    () =>
      overridesForFields.fieldsId === fieldsId ? overridesForFields.values : {},
    [overridesForFields, fieldsId],
  );

  const fieldValues = useMemo(
    () => ({ ...fieldDefaults, ...fieldOverrides }),
    [fieldDefaults, fieldOverrides],
  );

  // tab: "preview" once files exist, unless user explicitly chose "code"
  const [tabOverride, setTabOverride] = useState<Tab | null>(null);
  const tab: Tab = tabOverride ?? (filePaths.length > 0 ? "preview" : "code");

  // selected: /Email.tsx or first file, unless user clicked a different file
  const defaultSelected = filePaths.includes("/Email.tsx")
    ? "/Email.tsx"
    : (filePaths[0] ?? null);
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const selected =
    selectedOverride !== null && filePaths.includes(selectedOverride)
      ? selectedOverride
      : defaultSelected;

  const [previewLoading, setPreviewLoading] = useState(false);
  const fetchPreviewRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save after every AI response that produces files
  useEffect(() => {
    if (lastFinishedAt === 0 || filePaths.length === 0) return;

    if (templateIdRef.current) {
      fetch(`/api/templates/${templateIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, fields, fieldValues: fieldDefaults }),
      }).catch(console.error);
    } else {
      const name = extractTemplateName(
        messages as Parameters<typeof extractTemplateName>[0],
      );
      fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          files,
          fields,
          fieldValues: fieldDefaults,
        }),
      })
        .then((r) => r.json())
        .then((data: { id?: string }) => {
          if (data.id) {
            templateIdRef.current = data.id;
            router.replace(`/generate?template=${data.id}`);
          }
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFinishedAt]);

  const handleFetchReady = useCallback((fn: () => void) => {
    fetchPreviewRef.current = fn;
  }, []);

  const handleFieldChange = (id: string, value: string) => {
    const next = { ...fieldOverrides, [id]: value };
    setOverridesForFields({ fieldsId, values: next });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreviewRef.current?.();
      if (templateIdRef.current) {
        fetch(`/api/templates/${templateIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldValues: { ...fieldDefaults, ...next } }),
        }).catch(console.error);
      }
    }, 800);
  };

  if (filePaths.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <TbMail />
        </span>
        <span>Les fichiers générés apparaîtront ici</span>
      </div>
    );
  }

  const content = selected ? (files[selected]?.content ?? null) : null;
  const showSidebar = tab === "preview" && fields.length > 0;

  return (
    <>
      <div className={styles.tabs}>
        <button
          className={styles.tab}
          data-active={tab === "preview" ? "true" : "false"}
          onClick={() => setTabOverride("preview")}
        >
          Aperçu
        </button>
        {tab === "preview" && (
          <>
            <span
              className={styles.previewDot}
              data-loading={String(previewLoading)}
            />
            {previewLoading && (
              <span className={styles.previewStatus}>Rendu en cours…</span>
            )}
            <button
              className={styles.refreshBtn}
              onClick={() => fetchPreviewRef.current?.()}
              disabled={previewLoading}
            >
              Actualiser
            </button>
          </>
        )}
      </div>

      {tab === "preview" ? (
        <div className={styles.previewArea}>
          <EmailPreviewFrame
            files={files}
            fieldValues={fieldValues}
            lastFinishedAt={lastFinishedAt}
            onLoadingChange={setPreviewLoading}
            onFetchReady={handleFetchReady}
          />
          {showSidebar && (
            <FieldEditorSidebar
              fields={fields}
              fieldValues={fieldValues}
              files={files}
              onChange={handleFieldChange}
            />
          )}
        </div>
      ) : (
        <div className={styles.split}>
          <nav className={styles.tree}>
            {filePaths.map((path) => (
              <button
                key={path}
                className={styles.treeItem}
                data-active={path === selected ? "true" : "false"}
                onClick={() => setSelectedOverride(path)}
              >
                <span className={styles.treeIcon}>
                  {path.endsWith(".tsx") || path.endsWith(".ts") ? "TS" : "📄"}
                </span>
                <span className={styles.treeLabel}>
                  {path.replace(/^\//, "")}
                </span>
              </button>
            ))}
          </nav>

          <div className={styles.viewer}>
            {content !== null ? (
              <pre className={styles.code}>{content}</pre>
            ) : (
              <p className={styles.noFile}>
                Sélectionnez un fichier pour afficher son contenu.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
