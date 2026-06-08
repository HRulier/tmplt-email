"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";

interface Props {
  id: string;
  name: string;
  updatedAt: string;
}

export function TemplateCard({ id, name, updatedAt }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.cardWrapper}>
      <Link href={`/generate?template=${id}`} className={styles.card}>
        <p className={styles.cardName}>{name}</p>
        <p className={styles.cardMeta}>
          Updated{" "}
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </Link>
      <button
        className={styles.deleteBtn}
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete template"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}
