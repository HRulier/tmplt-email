"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import styles from "./theme.module.css";

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  unsubscribeUrl: string;
  fontFamily: string;
}

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Poppins",
  "Montserrat", "Playfair Display", "Raleway",
];
const SYSTEM_FONTS = ["Arial", "Georgia", "Verdana", "Trebuchet MS"];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
function isValidHex(val: string) {
  return val === "" || HEX_REGEX.test(val);
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const swatchColor = HEX_REGEX.test(value) ? value : "#e5e7eb";
  return (
    <div className={styles.colorRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.colorInputs}>
        <div className={styles.swatchWrap} style={{ background: swatchColor }}>
          <input
            type="color"
            value={HEX_REGEX.test(value) ? value : "#6366f1"}
            onChange={(e) => onChange(e.target.value)}
            className={styles.nativePicker}
            aria-label={label}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || v.startsWith("#")) onChange(v);
          }}
          placeholder="#6366f1"
          maxLength={7}
          className={`${styles.hexInput}${value && !isValidHex(value) ? ` ${styles.inputError}` : ""}`}
          aria-label={`${label} valeur hexadécimale`}
        />
      </div>
    </div>
  );
}

export function ThemeForm({ initialTheme }: { initialTheme: Theme }) {
  const { show } = useToast();
  const [primaryColor, setPrimaryColor] = useState(initialTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialTheme.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(initialTheme.logoUrl);
  const [unsubscribeUrl, setUnsubscribeUrl] = useState(initialTheme.unsubscribeUrl);
  const [fontFamily, setFontFamily] = useState(initialTheme.fontFamily);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedTheme, setSavedTheme] = useState<Theme>(initialTheme);
  const [logoError, setLogoError] = useState(false);

  const isDirty =
    primaryColor !== savedTheme.primaryColor ||
    secondaryColor !== savedTheme.secondaryColor ||
    logoUrl !== savedTheme.logoUrl ||
    unsubscribeUrl !== savedTheme.unsubscribeUrl ||
    fontFamily !== savedTheme.fontFamily;

  useEffect(() => {
    if (!GOOGLE_FONTS.includes(fontFamily)) return;
    const id = `gf-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const handleLogoUrlChange = useCallback((val: string) => {
    setLogoUrl(val);
    setLogoError(false);
  }, []);

  const handleSave = async () => {
    if (!isValidHex(primaryColor) || !isValidHex(secondaryColor)) {
      show("Format de couleur invalide. Utilisez le format #RRGGBB.", "error");
      return;
    }
    setSaveState("saving");
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor, secondaryColor, logoUrl, unsubscribeUrl, fontFamily }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as Theme;
      setSavedTheme(data);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      show("Erreur lors de l'enregistrement.", "error");
      setSaveState("idle");
    }
  };

  const effectivePrimary = HEX_REGEX.test(primaryColor) ? primaryColor : "#6366f1";
  const effectiveSecondary = HEX_REGEX.test(secondaryColor) ? secondaryColor : "";
  const previewFont = fontFamily ? `'${fontFamily}', sans-serif` : "inherit";

  return (
    <div className={styles.layout}>
      {/* Form */}
      <div className={styles.form}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Couleurs</h2>
          <ColorField label="Couleur primaire" value={primaryColor} onChange={setPrimaryColor} />
          <ColorField label="Couleur secondaire" value={secondaryColor} onChange={setSecondaryColor} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Typographie</h2>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="fontFamily">Police</label>
            <select
              id="fontFamily"
              className={styles.select}
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="">Défaut (système)</option>
              <optgroup label="Google Fonts">
                {GOOGLE_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
              <optgroup label="Polices système">
                {SYSTEM_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
            </select>
          </div>
          {fontFamily && (
            <p key={fontFamily} className={styles.fontPreview} style={{ fontFamily: previewFont }}>
              Voici à quoi ressemblera votre texte avec {fontFamily}.
            </p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Logo</h2>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="logoUrl">URL du logo</label>
            <input
              id="logoUrl"
              type="url"
              className={styles.input}
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
          {logoUrl && !logoError && (
            <div className={styles.logoPreviewWrap}>
              <img
                key={logoUrl}
                src={logoUrl}
                alt="Aperçu logo"
                className={styles.logoPreview}
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          {logoUrl && logoError && (
            <p className={styles.logoError}>Impossible de charger cette image.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Paramètres email</h2>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="unsubscribeUrl">Lien de désinscription</label>
            <input
              id="unsubscribeUrl"
              type="url"
              className={styles.input}
              value={unsubscribeUrl}
              onChange={(e) => setUnsubscribeUrl(e.target.value)}
              placeholder="https://example.com/unsubscribe"
            />
          </div>
        </section>

        <button
          className={styles.saveBtn}
          data-state={saveState}
          onClick={handleSave}
          disabled={saveState === "saving" || !isDirty}
        >
          {saveState === "saving" ? (
            <>
              <span className={styles.saveBtnSpinner} />
              Enregistrement…
            </>
          ) : saveState === "saved" ? (
            "✓ Sauvegardé"
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>

      {/* Live Preview */}
      <div className={styles.previewCol}>
        <p className={styles.previewLabel}>Aperçu en direct</p>
        <div className={styles.previewCard}>
          <div className={styles.previewHeader} style={{ background: effectivePrimary }}>
            {logoUrl && !logoError ? (
              <img key={logoUrl} src={logoUrl} alt="" height={28} className={styles.previewLogo} />
            ) : (
              <div className={styles.previewLogoPlaceholder} />
            )}
          </div>
          <div className={styles.previewBody} style={{ fontFamily: previewFont }}>
            <div className={styles.previewTitle}>Titre de votre email</div>
            <div className={styles.previewText}>
              Corps du message avec votre typographie configurée.
            </div>
            <div className={styles.previewBtn} style={{ background: effectivePrimary }}>
              Bouton CTA
            </div>
            {effectiveSecondary && (
              <div
                className={styles.previewBadge}
                style={{ color: effectiveSecondary, borderColor: effectiveSecondary }}
              >
                Accent secondaire
              </div>
            )}
          </div>
          {unsubscribeUrl && (
            <div className={styles.previewFooter}>
              <span className={styles.previewUnsub}>Se désabonner</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
