"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import styles from "./Header.module.css";

export function Header({ name }: { name: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className={styles.header}>
      <span className={styles.name}>Hello {name} 👋</span>
      <button onClick={handleSignOut} className={styles.signOut}>
        Se déconnecter
      </button>
    </header>
  );
}
