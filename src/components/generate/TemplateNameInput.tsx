"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LuPencilLine } from "react-icons/lu";
import styles from "./TemplateNameInput.module.css";

export function TemplateNameInput() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/templates/${templateId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name?: string } | null) => {
        if (data?.name) setName(data.name);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [templateId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!templateId || !value.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value.trim() }),
      }).catch(console.error);
    }, 600);
  };

  if (!templateId) {
    return <span className={styles.placeholder}>Création du template…</span>;
  }

  if (!loaded) {
    return <span className={styles.placeholder}>…</span>;
  }

  return (
    <div className={styles.wrapper} data-focused={String(focused)}>
      {/* Hidden sizer — input stretches to match this */}
      <span className={styles.sizer} aria-hidden="true">
        {name || "Template name"}
      </span>
      <input
        className={styles.input}
        value={name}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Template name"
        spellCheck={false}
      />
      {!focused && <LuPencilLine className={styles.icon} size={13} />}
    </div>
  );
}
