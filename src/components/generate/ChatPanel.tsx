"use client";

import { useRef, useEffect, useState, useCallback, KeyboardEvent } from "react";
import { TbMail } from "react-icons/tb";
import { useTemplate, type AppUIMessage } from "@/contexts/TemplateContext";
import { UsageBanner } from "./UsageBanner";
import styles from "./ChatPanel.module.css";

export function ChatPanel() {
  const { messages, status, error, sendMessage, stop } = useTemplate();
  const [input, setInput] = useState("");
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll only when user is already at the bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming || quotaExceeded) return;
    setInput("");
    setIsSending(true);
    setIsAtBottom(true);
    sendMessage({ text });
    setTimeout(() => setIsSending(false), 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.panel}>
      <div
        ref={messagesRef}
        className={styles.messages}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <TbMail />
            </div>
            <span>Décrivez l&apos;email que vous souhaitez générer.</span>
            <span className={styles.emptyHint}>
              Exemple : &ldquo;Un email de confirmation d&apos;abonnement avec
              un logo, un titre et un bouton d&apos;appel à
              l&apos;action.&rdquo;
            </span>
          </div>
        )}

        {(messages as AppUIMessage[]).map((msg) => {
          const textParts = msg.parts.filter((p) => p.type === "text");
          const toolParts = msg.parts.filter((p) => p.type.startsWith("tool-"));

          return (
            <div key={msg.id} className={styles.message} data-role={msg.role}>
              {textParts.map((p, i) =>
                p.type === "text" && p.text ? (
                  <div key={i} className={styles.bubble}>
                    {p.text}
                  </div>
                ) : null,
              )}
              {toolParts.map((p, i) => {
                const toolName = p.type
                  .replace(/^tool-/, "")
                  .replace(/_/g, " ");
                const isDone =
                  "state" in p && (p as { state: string }).state === "output";
                return (
                  <div key={i} className={styles.toolBadge}>
                    <span
                      className={styles.toolDot}
                      data-done={String(isDone)}
                    />
                    <span>{toolName}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {isStreaming && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
          </div>
        )}

        <div ref={bottomRef} />

        {!isAtBottom && (
          <button className={styles.scrollToBottom} onClick={scrollToBottom}>
            ↓ Nouveaux messages
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <UsageBanner onQuotaChange={setQuotaExceeded} />
        <div className={styles.statusBar}>
          {error && <span style={{ color: "var(--color-error-text)" }}>{error.message}</span>}
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre template d'email…"
            rows={1}
            disabled={quotaExceeded}
          />
          {isStreaming ? (
            <button
              type="button"
              className={styles.stopBtn}
              onClick={stop}
              title="Arrêter"
            >
              ■
            </button>
          ) : (
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!input.trim() || quotaExceeded}
              data-sending={String(isSending)}
              title="Envoyer"
            >
              ↑
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
