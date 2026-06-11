"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { InputEmail } from "@/components/ui/InputEmail";
import { InputPassword } from "@/components/ui/InputPassword";
import styles from "../auth.module.css";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Identifiants incorrects" });
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>E</div>
        <h1 className={styles.title}>Connexion</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputEmail name="email" control={form.control} label="Email" />
          <InputPassword name="password" control={form.control} label="Mot de passe" />

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
            {form.formState.isSubmitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/reset-password" className={styles.link}>
            Mot de passe oublié ?
          </Link>
          <span className={styles.separator}>·</span>
          <Link href="/sign-up" className={styles.link}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
