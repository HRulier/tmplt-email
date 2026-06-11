"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
} from "react";
import styles from "./Toast.module.css";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(
      () => setToasts((ts) => ts.filter((t) => t.id !== id)),
      280,
    );
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((ts) => [...ts, { id, message, variant, exiting: false }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={styles.container}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={styles.toast}
            data-variant={t.variant}
            data-exiting={String(t.exiting)}
            role="status"
          >
            <span className={styles.iconWrap}>
              {t.variant === "success" ? "✓" : t.variant === "error" ? "✕" : "ℹ"}
            </span>
            <span className={styles.message}>{t.message}</span>
            <button
              className={styles.closeBtn}
              onClick={() => dismiss(t.id)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
