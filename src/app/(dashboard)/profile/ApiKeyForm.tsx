"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

const schema = z.object({
  apiKey: z
    .string()
    .min(20, "Clé trop courte")
    .startsWith("sk-ant-", "Format invalide — la clé doit commencer par sk-ant-"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  hasApiKey: boolean;
  maskedKey: string | null;
}

export function ApiKeyForm({ hasApiKey, maskedKey }: Props) {
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { apiKey: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: values.apiKey }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) {
      form.setError("root", { message: data.error ?? "Une erreur est survenue" });
      return;
    }
    form.reset();
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/profile/api-key", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setDeleteError(data.error ?? "Une erreur est survenue");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      {/* Current key status */}
      <div className={styles.keyStatus}>
        {hasApiKey ? (
          <div className={styles.keyActive}>
            <span className={styles.keyDot} />
            <span className={styles.maskedKey}>{maskedKey}</span>
          </div>
        ) : (
          <p className={styles.noKey}>
            Aucune clé configurée — la clé du serveur est utilisée.
          </p>
        )}
      </div>

      {/* Add / update key form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
        <label className={styles.label} htmlFor="apiKey">
          {hasApiKey ? "Remplacer la clé" : "Ajouter une clé"}
        </label>
        <div className={styles.inputRow}>
          <input
            id="apiKey"
            type={showKey ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-..."
            className={`${styles.input} ${form.formState.errors.apiKey ? styles.inputError : ""}`}
            {...form.register("apiKey")}
          />
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
          >
            {showKey ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {form.formState.errors.apiKey && (
          <p className={styles.fieldError}>{form.formState.errors.apiKey.message}</p>
        )}
        {form.formState.errors.root && (
          <p className={styles.fieldError}>{form.formState.errors.root.message}</p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Validation en cours…" : "Enregistrer la clé"}
          </button>

          {hasApiKey && (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression…" : "Supprimer la clé"}
            </button>
          )}
        </div>
        {deleteError && <p className={styles.fieldError}>{deleteError}</p>}
      </form>
    </div>
  );
}
