"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import styles from "./Header.module.css";

const BACK_ROUTES: { match: RegExp; href: string; label: string }[] = [
  { match: /^\/generate/, href: "/dashboard", label: "Dashboard" },
];

export function Header({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const back = BACK_ROUTES.find((r) => r.match.test(pathname));

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className={styles.header}>
      {back && (
        <>
          <Link href={back.href} className={styles.backBtn}>
            ← {back.label}
          </Link>
          <div className={styles.divider} />
        </>
      )}
      <span className={styles.name}>Hello {name} 👋</span>
      <button onClick={handleSignOut} className={styles.signOut}>
        Sign out
      </button>
    </header>
  );
}
