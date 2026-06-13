import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserSettingsModel } from "@/lib/models/user-settings.model";
import { decryptApiKey } from "@/lib/crypto";
import { ApiKeyForm } from "./ApiKeyForm";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  await connectDB();
  const settings = await UserSettingsModel
    .findOne({ userId: session.user.id })
    .select("+encryptedApiKey")
    .lean();

  const hasApiKey = !!(settings?.encryptedApiKey);
  let maskedKey: string | null = null;
  if (settings?.encryptedApiKey) {
    try {
      const plain = decryptApiKey(settings.encryptedApiKey);
      maskedKey = `sk-ant-...••••••••••••••••••••${plain.slice(-4)}`;
    } catch { /* ignore */ }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profil</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Clé API Anthropic personnelle</h2>
        <p className={styles.sectionDesc}>
          Utilisez votre propre clé pour consommer vos tokens plutôt que ceux du serveur.
        </p>

        <div className={styles.notice}>
          <svg className={styles.noticeIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            Votre clé est chiffrée avec <strong>AES-256-GCM</strong> avant d&apos;être stockée.
            Elle n&apos;est jamais transmise en dehors des appels à l&apos;API Anthropic et n&apos;est jamais accessible en clair depuis l&apos;interface.
          </p>
        </div>

        <ApiKeyForm hasApiKey={hasApiKey} maskedKey={maskedKey} />
      </section>
    </div>
  );
}
