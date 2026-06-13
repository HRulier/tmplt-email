"use client";

import { useState, KeyboardEvent } from "react";
import type { FieldDef, SerializedVFS } from "@/types";
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
  const [sendEmail, setSendEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<"ok" | "error" | null>(null);
  const [showSendForm, setShowSendForm] = useState(false);

  const handleSend = async () => {
    if (!sendEmail.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendEmail.trim(), files, fieldValues }),
      });
      setSendResult(res.ok ? "ok" : "error");
    } catch {
      setSendResult("error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape") setShowSendForm(false);
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
        {showSendForm ? (
          <div className={styles.sendForm}>
            <input
              className={styles.sendInput}
              type="email"
              placeholder="you@example.com"
              value={sendEmail}
              onChange={(e) => {
                setSendEmail(e.target.value);
                setSendResult(null);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.sendActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowSendForm(false);
                  setSendResult(null);
                }}
                disabled={sending}
              >
                Annuler
              </button>
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!sendEmail.trim() || sending}
              >
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
            {sendResult === "ok" && (
              <p className={styles.successMsg}>Email envoyé !</p>
            )}
            {sendResult === "error" && (
              <p className={styles.errorMsg}>
                Échec de l&apos;envoi. Réessayez.
              </p>
            )}
          </div>
        ) : (
          <button
            className={styles.testBtn}
            onClick={() => {
              setShowSendForm(true);
              setSendResult(null);
            }}
          >
            Envoyer l&apos;email
          </button>
        )}
      </div>
    </aside>
  );
}
