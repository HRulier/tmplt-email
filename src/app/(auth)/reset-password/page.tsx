"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { InputEmail } from "@/components/ui/InputEmail";
import { InputPassword } from "@/components/ui/InputPassword";
import styles from "../auth.module.css";

const requestSchema = z.object({
  email: z.string().email("Email invalide"),
});

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(128, "Mot de passe trop long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        "Doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function RequestForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: RequestValues) => {
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>E</div>
          <div className={styles.submittedState}>
            <div className={styles.submittedIcon}>✓</div>
            <p className={styles.submittedTitle}>Email envoyé</p>
            <p className={styles.submittedDesc}>
              Si un compte est associé à cet email, vous recevrez un lien dans quelques minutes.
            </p>
          </div>
          <div className={styles.links}>
            <Link href="/sign-in" className={styles.link}>Retour à la connexion</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>E</div>
        <h1 className={styles.title}>Mot de passe oublié</h1>
        <p className={styles.description}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputEmail
            name="email"
            control={form.control}
            label="Email"
            autoFocus
            disabled={form.formState.isSubmitting}
          />

          {form.formState.errors.root && (
            <p className={styles.errorGlobal} role="alert">
              {form.formState.errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
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
  const [succeeded, setSucceeded] = useState(false);
  const router = useRouter();

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      form.setError("root", {
        message: "Lien invalide ou expiré. Faites une nouvelle demande de réinitialisation.",
      });
      return;
    }

    setSucceeded(true);
    setTimeout(() => router.push("/sign-in"), 3000);
  };

  if (succeeded) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>E</div>
          <div className={styles.submittedState}>
            <div className={styles.submittedIcon}>✓</div>
            <p className={styles.submittedTitle}>Mot de passe mis à jour</p>
            <p className={styles.submittedDesc}>Redirection vers la connexion…</p>
          </div>
          <div className={styles.links}>
            <Link href="/sign-in" className={styles.link}>Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>E</div>
        <h1 className={styles.title}>Nouveau mot de passe</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputPassword
            name="password"
            control={form.control}
            label="Nouveau mot de passe"
            autoComplete="new-password"
            disabled={form.formState.isSubmitting}
          />
          <InputPassword
            name="confirmPassword"
            control={form.control}
            label="Confirmer le mot de passe"
            autoComplete="new-password"
            disabled={form.formState.isSubmitting}
          />

          {form.formState.errors.root && (
            <p className={styles.errorGlobal} role="alert">
              {form.formState.errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={styles.submit}
          >
            {form.formState.isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) return <ResetForm token={token} />;
  return <RequestForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
