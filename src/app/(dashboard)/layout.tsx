import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <ToastProvider>
      <div className={styles.wrapper}>
        <Header name={session.user.name} />
        <main className={styles.main}>{children}</main>
      </div>
    </ToastProvider>
  );
}
