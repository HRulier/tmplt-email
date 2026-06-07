"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <button onClick={handleSignOut} className={styles.signOut}>
          Se déconnecter
        </button>
      </header>
    </div>
  );
}
