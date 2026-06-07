"use client";

import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import styles from "./Input.module.css";

interface InputPasswordProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
}

export function InputPassword<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "••••••••",
  autoComplete = "current-password",
}: InputPasswordProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={styles.field}>
          <label htmlFor={name} className={styles.label}>
            {label}
          </label>
          <div className={styles.inputWrapper}>
            <input
              {...field}
              id={name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? `${name}-error` : undefined}
              className={`${styles.input} ${styles.inputWithToggle} ${fieldState.error ? styles.inputError : ""}`}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className={styles.toggle}
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {visible ? "Masquer" : "Afficher"}
            </button>
          </div>
          {fieldState.error && (
            <span id={`${name}-error`} className={styles.error} role="alert">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  );
}
