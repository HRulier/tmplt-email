"use client";

import { useState } from "react";
import type { FieldDef, SerializedVFS } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { renderVfsToHtml } from "@/lib/render-vfs-client";
import styles from "./FieldEditorSidebar.module.css";

interface Props {
  fields: FieldDef[];
  fieldValues: Record<string, string>;
  files: SerializedVFS;
  onChange: (id: string, value: string) => void;
}

export function FieldEditorSidebar({
  fields,
  fieldValues,
  files,
  onChange,
}: Props) {
  const { show } = useToast();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const html = await renderVfsToHtml(files, fieldValues);
      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (res.ok) {
        show("Email envoyé à votre adresse !", "success");
      } else if (res.status === 429) {
        show("Limite quotidienne atteinte. Réessayez demain.", "error");
      } else {
        show("Échec de l'envoi. Réessayez.", "error");
      }
    } catch {
      show("Échec du rendu ou de l'envoi.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>Champs</div>

      <div className={styles.fields}>
        {fields.length === 0 ? (
          <p className={styles.empty}>Aucun champ modifiable défini.</p>
        ) : (
          fields.map((field) => (
            <div key={field.id} className={styles.field}>
              <label className={styles.label}>{field.label}</label>
              {field.type === "image" ? (
                <input
                  className={styles.input}
                  type="url"
                  placeholder={field.defaultValue || "https://…"}
                  value={fieldValues[field.id] ?? field.defaultValue}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              ) : (
                <textarea
                  className={styles.textarea}
                  placeholder={field.defaultValue}
                  value={fieldValues[field.id] ?? field.defaultValue}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  rows={2}
                />
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.testBtn}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "Envoi…" : "Envoyer un email de test"}
        </button>
      </div>
    </aside>
  );
}
