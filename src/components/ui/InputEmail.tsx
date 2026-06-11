"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import styles from "./Input.module.css";

interface InputEmailProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function InputEmail<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "you@example.com",
  disabled,
  autoFocus,
}: InputEmailProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={styles.field}>
          <label htmlFor={name} className={styles.label}>
            {label}
          </label>
          <input
            {...field}
            id={name}
            type="email"
            placeholder={placeholder}
            autoComplete="email"
            disabled={disabled}
            autoFocus={autoFocus}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
            className={`${styles.input} ${fieldState.error ? styles.inputError : ""}`}
          />
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
