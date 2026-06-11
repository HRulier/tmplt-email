"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTemplate } from "@/contexts/TemplateContext";
import styles from "./ChatPanel.module.css";

interface UsageData {
  count: number;
  limit: number;
  hasOwnKey: boolean;
}

interface Props {
  onQuotaChange: (exceeded: boolean) => void;
}

export function UsageBanner({ onQuotaChange }: Props) {
  const { lastFinishedAt } = useTemplate();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/chat/usage")
      .then((r) => r.json())
      .then((data: UsageData) => {
        setUsage(data);
        onQuotaChange(!data.hasOwnKey && data.count >= data.limit);
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFinishedAt]);

  if (!usage || usage.hasOwnKey) return null;

  const { count, limit } = usage;
  const exceeded = count >= limit;
  const pct = Math.min((count / limit) * 100, 100);

  if (exceeded) {
    return (
      <div className={`${styles.usageBanner} ${styles.usageBannerAlert}`}>
        <p className={styles.usageAlertText}>
          Vous avez atteint la limite de {limit} requêtes gratuites.
        </p>
        <Link href="/profile" className={styles.usageLink}>
          Configurer votre propre clé API →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.usageBanner}>
      <div className={styles.usageRow}>
        <span className={styles.usageText}>{count} / {limit} requêtes utilisées</span>
        <Link href="/profile" className={styles.usageLink}>
          Configurer votre propre clé →
        </Link>
      </div>
      <div className={styles.usageBar}>
        <div className={styles.usageBarFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
