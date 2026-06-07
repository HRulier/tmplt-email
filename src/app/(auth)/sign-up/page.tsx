"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { InputEmail } from "@/components/ui/InputEmail";
import { InputPassword } from "@/components/ui/InputPassword";
import styles from "../auth.module.css";

const schema = z
  .object({
    name: z.string().min(2, "Nom requis (2 caractères minimum)"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Erreur lors de la création du compte" });
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Créer un compte</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Nom</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jean Dupont"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? "name-error" : undefined}
              className={`${styles.input} ${form.formState.errors.name ? styles.inputError : ""}`}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <span id="name-error" className={styles.error} role="alert">
                {form.formState.errors.name.message}
              </span>
            )}
          </div>

          <InputEmail name="email" control={form.control} label="Email" />
          <InputPassword
            name="password"
            control={form.control}
            label="Mot de passe"
            autoComplete="new-password"
          />
          <InputPassword
            name="confirmPassword"
            control={form.control}
            label="Confirmer le mot de passe"
            autoComplete="new-password"
            placeholder="••••••••"
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
            {form.formState.isSubmitting ? "Création…" : "Créer un compte"}
          </button>
        </form>

        <div className={styles.links}>
          <span>Déjà un compte ?</span>
          <Link href="/sign-in" className={styles.link}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
