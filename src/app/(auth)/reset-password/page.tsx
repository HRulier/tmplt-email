"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { InputEmail } from "@/components/ui/InputEmail";
import { InputPassword } from "@/components/ui/InputPassword";
import styles from "../auth.module.css";

const requestSchema = z.object({
  email: z.string().email("Email invalide"),
});

const resetSchema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
}).refine(() => true);

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function RequestForm() {
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: RequestValues) => {
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Erreur lors de l'envoi" });
      return;
    }

    form.setError("root", { message: "✓ Email envoyé — vérifiez votre boîte de réception" });
  };

  const isSuccess = form.formState.errors.root?.message?.startsWith("✓");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Mot de passe oublié</h1>
        <p className={styles.description}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputEmail name="email" control={form.control} label="Email" />

          {form.formState.errors.root && (
            <p className={isSuccess ? styles.success : styles.errorGlobal} role="alert">
              {form.formState.errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting || isSuccess}
            className={styles.submit}
          >
            {form.formState.isSubmitting ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/sign-in" className={styles.link}>Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}

function ResetForm({ token }: { token: string }) {
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Erreur lors de la réinitialisation" });
      return;
    }

    form.setError("root", { message: "✓ Mot de passe mis à jour — vous pouvez vous connecter" });
  };

  const isSuccess = form.formState.errors.root?.message?.startsWith("✓");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputPassword
            name="password"
            control={form.control}
            label="Nouveau mot de passe"
            autoComplete="new-password"
          />

          {form.formState.errors.root && (
            <p className={isSuccess ? styles.success : styles.errorGlobal} role="alert">
              {form.formState.errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting || isSuccess}
            className={styles.submit}
          >
            {form.formState.isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        {isSuccess && (
          <div className={styles.links}>
            <Link href="/sign-in" className={styles.link}>Se connecter</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) return <ResetForm token={token} />;
  return <RequestForm />;
}
