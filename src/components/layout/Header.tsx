"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { TemplateNameInput } from "@/components/generate/TemplateNameInput";
import styles from "./Header.module.css";

const BACK_ROUTES: { match: RegExp; href: string; label: string }[] = [
  { match: /^\/generate/, href: "/dashboard", label: "Tableau de bord" },
  { match: /^\/profile/, href: "/dashboard", label: "Tableau de bord" },
];

export function Header({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  const back = BACK_ROUTES.find((r) => r.match.test(pathname));
  const isGenerate = /^\/generate/.test(pathname);

  useEffect(() => {
    const onScroll = () => {
      headerRef.current?.setAttribute(
        "data-scrolled",
        String(window.scrollY > 0),
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header ref={headerRef} className={styles.header}>
      {back && (
        <>
          <Link href={back.href} className={styles.backBtn}>
            ← {back.label}
          </Link>
          <div className={styles.divider} />
        </>
      )}
      {isGenerate ? (
        <Suspense fallback={<span className={styles.name} />}>
          <TemplateNameInput />
        </Suspense>
      ) : (
        <span className={styles.name}>Bonjour {name} 👋</span>
      )}
      <Link href="/profile" className={styles.profileBtn}>
        Mon profil
      </Link>
      <button onClick={handleSignOut} className={styles.signOut}>
        Déconnexion
      </button>
    </header>
  );
}
