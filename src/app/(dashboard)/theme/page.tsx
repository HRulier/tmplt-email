import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ThemeModel } from "@/lib/models/theme.model";
import { ThemeForm } from "./ThemeForm";
import styles from "./theme.module.css";

export default async function ThemePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  await connectDB();
  const doc = await ThemeModel.findOne({ userId: session.user.id }).lean();

  const initialTheme = {
    primaryColor: doc?.primaryColor ?? "",
    secondaryColor: doc?.secondaryColor ?? "",
    logoUrl: doc?.logoUrl ?? "",
    unsubscribeUrl: doc?.unsubscribeUrl ?? "",
    fontFamily: doc?.fontFamily ?? "",
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Thème</h1>
      <p className={styles.desc}>
        Personnalisez l&apos;identité visuelle de vos emails générés par
        l&apos;IA.
      </p>
      <ThemeForm initialTheme={initialTheme} />
    </div>
  );
}
