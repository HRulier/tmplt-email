"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ConfirmDeleteModal.module.css";

interface Props {
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ templateName, onConfirm, onCancel }: Props) {
  const [visible, setVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    setVisible(false);
    setTimeout(onCancel, 200);
  };

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(onConfirm, 200);
  };

  return (
    <div
      className={styles.backdrop}
      data-visible={String(visible)}
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className={styles.modal} data-visible={String(visible)} role="dialog" aria-modal="true">
        <div className={styles.iconWrap}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2 className={styles.title}>Supprimer le template ?</h2>
        <p className={styles.description}>
          <span className={styles.templateName}>{templateName}</span> sera supprimé définitivement.
        </p>
        <div className={styles.actions}>
          <button ref={cancelRef} className={styles.cancelBtn} onClick={handleCancel}>
            Annuler
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
