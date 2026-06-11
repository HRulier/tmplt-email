"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteTemplate } from "./actions";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import styles from "./dashboard.module.css";

interface Props {
  id: string;
  name: string;
  updatedAt: string;
  isExample?: boolean;
}

export function TemplateCard({ id, name, updatedAt, isExample }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await deleteTemplate(id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className={styles.cardWrapper}>
        <Link href={`/generate?template=${id}`} className={styles.card}>
          {isExample && <span className={styles.exampleBadge}>Exemple</span>}
          <p className={styles.cardName}>{name}</p>
          <p className={styles.cardMeta}>
            Modifié le{" "}
            {new Date(updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </Link>
        <button
          className={styles.deleteBtn}
          onClick={handleDeleteClick}
          disabled={deleting}
          aria-label="Supprimer le template"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {confirming && (
        <ConfirmDeleteModal
          templateName={name}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
