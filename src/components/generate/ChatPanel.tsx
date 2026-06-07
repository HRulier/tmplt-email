"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import styles from "./ChatPanel.module.css";

export function ChatPanel() {
  const { messages, status, error, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✉</div>
            <span>Describe the email you want to generate.</span>
            <span className={styles.emptyHint}>
              Try: "A subscription confirmation email with a logo, headline, and CTA button."
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const textParts = msg.parts.filter((p) => p.type === "text");
          const toolParts = msg.parts.filter((p) => p.type.startsWith("tool-"));

          return (
            <div key={msg.id} className={styles.message} data-role={msg.role}>
              {textParts.map((p, i) =>
                p.type === "text" && p.text ? (
                  <div key={i} className={styles.bubble}>{p.text}</div>
                ) : null
              )}
              {toolParts.map((p, i) => {
                const toolName = p.type.replace(/^tool-/, "").replace(/_/g, " ");
                const isDone = "state" in p && (p as { state: string }).state === "output";
                return (
                  <div key={i} className={styles.toolBadge}>
                    <span className={styles.toolDot} data-done={String(isDone)} />
                    <span>{toolName}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.footer}>
        <div className={styles.statusBar}>
          {error && <span style={{ color: "#dc2626" }}>{error.message}</span>}
          {isStreaming && !error && <span>Generating…</span>}
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
            placeholder="Describe your email template…"
            rows={1}
          />
          {isStreaming ? (
            <button type="button" className={styles.stopBtn} onClick={stop} title="Stop">
              ■
            </button>
          ) : (
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!input.trim()}
              title="Send"
            >
              ↑
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
